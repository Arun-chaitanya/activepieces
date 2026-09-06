import { createAction, Property } from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { google } from 'googleapis';
import { includeTeamDrivesProp } from '../common/props';
import {
	createGoogleClient,
	driveAuthPlaceholder,
	getAccessToken,
	googleSheetsAuth,
	isDriveCapableAuth,
	requireDriveAuth,
} from '../common/common';
import { AppConnectionType, isNil } from '@activepieces/shared';

// OPPLIFY: two paths. Without a folder the spreadsheet is created through
// the Sheets API (no Drive scope needed) in the root of My Drive. Choosing a
// folder needs Drive — listing folders and creating the file inside one — so
// the folder picker answers with the service-account notice on the pooled
// OAuth login and the run refuses a folder without Drive-capable auth
// (sprints/google-scopes-unrestricted.md D3).
export const createSpreadsheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-spreadsheet',
	displayName: 'Create Spreadsheet',
	description: 'Creates a blank spreadsheet.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the new spreadsheet.',
			required: true,
		}),
		includeTeamDrives: includeTeamDrivesProp(),
		folder: Property.Dropdown({
			auth: googleSheetsAuth,
			displayName: 'Parent Folder',
			description:
				'Needs a service-account connection. Leave empty to create the spreadsheet in the root of My Drive.',
			required: false,
			refreshers: ['auth', 'includeTeamDrives'],
			options: async ({ auth, includeTeamDrives }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please authenticate first',
					};
				}
				if (!isDriveCapableAuth(auth)) {
					return driveAuthPlaceholder();
				}
				const authProp = auth;
				let folders: { id: string; name: string }[] = [];
				const isServiceAccountWithoutImpersonation =
					authProp.type === AppConnectionType.CUSTOM_AUTH && authProp.props.userEmail?.length === 0;
				let pageToken = null;
				do {
					const request: HttpRequest = {
						method: HttpMethod.GET,
						url: `https://www.googleapis.com/drive/v3/files`,
						queryParams: {
							q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
							includeItemsFromAllDrives:
								includeTeamDrives || isServiceAccountWithoutImpersonation ? 'true' : 'false',
							supportsAllDrives: 'true',
						},
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: await getAccessToken(authProp),
						},
					};
					if (pageToken) {
						if (request.queryParams !== undefined) {
							request.queryParams['pageToken'] = pageToken;
						}
					}
					try {
						const response = await httpClient.sendRequest<{
							files: { id: string; name: string; teamDriveId?: string }[];
							nextPageToken: string;
						}>(request);
						folders = folders.concat(
							response.body.files.filter(
								(file) => !isNil(file.teamDriveId) || !isServiceAccountWithoutImpersonation,
							),
						);
						pageToken = response.body.nextPageToken;
					} catch (e) {
						throw new Error(`Failed to get folders\nError:${e}`);
					}
				} while (pageToken);

				return {
					disabled: false,
					options: folders.map((folder: { id: string; name: string }) => {
						return {
							label: folder.name,
							value: folder.id,
						};
					}),
				};
			},
		}),
	},
	async run(context) {
		const { title, folder } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);

		if (folder) {
			requireDriveAuth(context.auth);
			const driveApi = google.drive({ version: 'v3', auth: authClient });
			const response = await driveApi.files.create({
				requestBody: {
					name: title,
					mimeType: 'application/vnd.google-apps.spreadsheet',
					parents: [folder],
				},
				supportsAllDrives: true,
				fields: 'id,webViewLink',
			});
			return { id: response.data.id, url: response.data.webViewLink };
		}

		const sheets = google.sheets({ version: 'v4', auth: authClient });
		const response = await sheets.spreadsheets.create({
			requestBody: { properties: { title } },
			fields: 'spreadsheetId,spreadsheetUrl',
		});
		return { id: response.data.spreadsheetId, url: response.data.spreadsheetUrl };
	},
});
