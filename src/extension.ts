import * as vscode from "vscode";
import { ElementsTreeDataProvider } from "./TreeData";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
const elementsTreeDataProvider = new ElementsTreeDataProvider();
  let disposable = vscode.window.registerTreeDataProvider(
    "qt-debug-tools.elements", elementsTreeDataProvider
  );
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
