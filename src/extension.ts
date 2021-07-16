import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	require('./tree');

	let disposable = vscode.commands.registerCommand('cloud-storage.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from cloud_storage!');
	});
	context.subscriptions.push(disposable);
}

export function deactivate() { }
