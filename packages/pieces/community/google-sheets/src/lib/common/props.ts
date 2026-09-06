import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import {
	columnToLabel,
	createGoogleClient,
	getHeaderRow,
	googleSheetsAuth,
	GoogleSheetsAuthValue,
	googleSheetsCommon,
	parseSpreadsheetId,
} from './common';
import { isNil } from '@activepieces/shared';

const createEmptyOptionList = (message: string) => {
	return {
		disabled: true,
		placeholder: message,
		options: [],
	};
};

export const includeTeamDrivesProp = () =>
	Property.Checkbox({
		displayName: 'Include Shared Drive Sheets ?',
		description: 'Turn this on to also see spreadsheets from Shared Drives.',
		defaultValue: false,
		required: false,
	});

export const spreadsheetIdProp = (displayName: string, description: string, required = true) =>
	Property.ShortText({
		displayName,
		description:
			description ||
			"Paste the spreadsheet's URL from your browser, or its id. The account you connected must have access to it.",
		required,
	});

export const sheetIdProp = (displayName: string, description: string, required = true) =>
	Property.Dropdown({
		displayName,
		description,
		auth: googleSheetsAuth,
		required,
		refreshers: ['spreadsheetId'],
		options: async ({ auth, spreadsheetId }) => {
			if (!auth) {
				return createEmptyOptionList('please connect your account first.');
			}

			if ((spreadsheetId ?? '').toString().length === 0) {
				return createEmptyOptionList('please select a spreadsheet first.');
			}

			const authValue = auth as GoogleSheetsAuthValue;

			const authClient = await createGoogleClient(authValue);

			const sheets = google.sheets({ version: 'v4', auth: authClient });

			const response = await sheets.spreadsheets.get({
				spreadsheetId: parseSpreadsheetId(spreadsheetId),
			});

			const sheetsData = response.data.sheets ?? [];

			const options: DropdownOption<number>[] = [];

			for (const sheet of sheetsData) {
				const title = sheet.properties?.title;
				const sheetId = sheet.properties?.sheetId;
				if (isNil(title) || isNil(sheetId)) {
					continue;
				}
				options.push({
					label: title,
					value: sheetId,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const commonProps = {
	spreadsheetId: spreadsheetIdProp('Spreadsheet', ''),
	sheetId: sheetIdProp('Worksheet', 'The ID of the worksheet to use.'),
};

export const rowValuesProp = () =>
	Property.DynamicProperties({
		displayName: 'Values',
		description: 'The values to add',
		required: true,
		auth: googleSheetsAuth,
		refreshers: ['sheetId', 'spreadsheetId', 'first_row_headers'],
		props: async ({ auth, spreadsheetId, sheetId, first_row_headers }) => {
			if (
				!auth ||
				(spreadsheetId ?? '').toString().length === 0 ||
				(sheetId ?? '').toString().length === 0
			) {
				return {};
			}
			const sheet_id = Number(sheetId);
			const authValue = auth as GoogleSheetsAuthValue;

			const headers = await googleSheetsCommon.getHeaderRow({
				spreadsheetId: parseSpreadsheetId(spreadsheetId),
				auth: authValue,
				sheetId: sheet_id,
			});

			if (!first_row_headers) {
				return {
					values: Property.Array({
						displayName: 'Row Values',
						required: true,
					}),
				};
			}
			const firstRow = headers ?? [];
			const properties: {
				[key: string]: any;
			} = {};

			for (let i = 0; i < firstRow.length; i++) {
				const label = columnToLabel(i);
				properties[label] = Property.ShortText({
					displayName: firstRow[i].toString(),
					// description: firstRow[i].toString(),
					required: false,
					defaultValue: '',
				});
			}
			return properties;
		},
	});

export const columnNameProp = () =>
	Property.Dropdown<string, true, typeof googleSheetsAuth>({
		displayName: 'Column Name',
		description: 'The name of the column to search in',
		required: true,
		auth: googleSheetsAuth,
		refreshers: ['sheetId', 'spreadsheetId'],
		options: async ({ auth, spreadsheetId, sheetId }) => {
			const spreadsheet_id = parseSpreadsheetId(spreadsheetId);
			const sheet_id = Number(sheetId) as number;
			if (
				!auth ||
				(spreadsheet_id ?? '').toString().length === 0 ||
				(sheet_id ?? '').toString().length === 0
			) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select a sheet first',
				};
			}

			const sheetName = await googleSheetsCommon.findSheetName(auth, spreadsheet_id, sheet_id);

			if (!sheetName) {
				throw Error('Sheet not found in spreadsheet');
			}

			const headers = await getHeaderRow({
				spreadsheetId: spreadsheet_id,
				auth,
				sheetId: sheet_id,
			});

			const ret = [];

			const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

			if (isNil(headers)) {
				return {
					options: [],
					disabled: false,
				};
			}
			if (headers.length === 0) {
				const columnSize = headers.length;

				for (let i = 0; i < columnSize; i++) {
					ret.push({
						label: alphabet[i].toUpperCase(),
						value: alphabet[i],
					});
				}
			} else {
				let index = 0;
				for (let i = 0; i < headers.length; i++) {
					let value = 'A';
					if (index >= alphabet.length) {
						// if the index is greater than the length of the alphabet, we need to add another letter
						const firstLetter = alphabet[Math.floor(index / alphabet.length) - 1];
						const secondLetter = alphabet[index % alphabet.length];
						value = firstLetter + secondLetter;
					} else {
						value = alphabet[index];
					}

					ret.push({
						label: headers[i].toString(),
						value: value,
					});
					index++;
				}
			}
			return {
				options: ret,
				disabled: false,
			};
		},
	});

export const isFirstRowHeaderProp = () =>
	Property.Checkbox({
		displayName: 'First Row Contains Headers ?',
		required: true,
		defaultValue: false,
	});
