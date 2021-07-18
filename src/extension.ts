import * as vscode from 'vscode';
import { isCheck, watchConfig } from './cloud';
import { registered } from './command';

export function activate(context: vscode.ExtensionContext) {
	if (isCheck()) {
		vscode.commands.executeCommand('setContext', 'cloud.storage.isShowView', true);
		require('./tree');
	}

	context.subscriptions.push(
		...registered,
		watchConfig
	);
}

export function deactivate() { }


