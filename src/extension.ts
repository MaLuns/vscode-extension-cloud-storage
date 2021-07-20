import * as vscode from 'vscode';
import { isCheck, watchConfig } from './cloud';
import { registered } from './command';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand('setContext', 'cloud.storage.isShowView', isCheck());
	require('./tree');
	context.subscriptions.push(
		...registered,
		watchConfig
	);
}

export function deactivate() { }

