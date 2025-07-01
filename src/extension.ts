import * as vscode from "vscode";
import { WidgetsTreeDataProvider } from "./widgetsTreeData";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const widgetsTreeDataProvider = new WidgetsTreeDataProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "qt-debug-tools.widgets",
      widgetsTreeDataProvider
    )
  );

  // Register a command to refresh the tree view
  context.subscriptions.push(
    vscode.commands.registerCommand("qt-debug-tools.refresh", () => {
      widgetsTreeDataProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("qt-debug-tools.helloWorld", (item) => {
      vscode.window.showInformationMessage("Hello World from Qt Debug Tools!", item);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
