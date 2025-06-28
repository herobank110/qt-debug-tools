import * as vscode from "vscode";
import { ElementsTreeDataProvider } from "./TreeData";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const elementsTreeDataProvider = new ElementsTreeDataProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "qt-debug-tools.elements",
      elementsTreeDataProvider
    )
  );

  // Register a command to refresh the tree view
  context.subscriptions.push(
    vscode.commands.registerCommand("qt-debug-tools.refresh", () => {
      elementsTreeDataProvider.refresh();
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
