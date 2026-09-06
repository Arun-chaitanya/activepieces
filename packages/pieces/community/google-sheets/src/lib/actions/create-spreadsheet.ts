import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

// OPPLIFY: created through the Sheets API instead of Drive. The upstream
// version listed Drive folders for a "Parent Folder" dropdown and created the
// file through drive.files.create; both need a Drive scope, which the Opplify
// Google connection deliberately does not request
// (sprints/google-scopes-unrestricted.md D1). The new spreadsheet lands in the
// root of My Drive, and the response carries its URL so the user can move it.
export const createSpreadsheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-spreadsheet',
	displayName: 'Create Spreadsheet',
	description: 'Creates a blank spreadsheet in the root of your Drive.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the new spreadsheet.',
			required: true,
		}),
	},
	async run(context) {
		const { title } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });
		const response = await sheets.spreadsheets.create({
			requestBody: { properties: { title } },
			fields: 'spreadsheetId,spreadsheetUrl',
		});

		return {
			id: response.data.spreadsheetId,
			url: response.data.spreadsheetUrl,
		};
	},
});
