import * as vscode from "vscode";

export class ElementsTreeDataProvider
  implements vscode.TreeDataProvider<ItemData>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ItemData | undefined | void
  > = new vscode.EventEmitter<ItemData | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ItemData | undefined | void> =
    this._onDidChangeTreeData.event;

//   constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ItemData): vscode.TreeItem {
    console.log("getTreeItem", element);
    return element;
  }

  getChildren(element?: ItemData): Thenable<ItemData[]> {
    // if (!this.workspaceRoot) {
    //   vscode.window.showInformationMessage("No dependency in empty workspace");
    //   return Promise.resolve([]);
    // }
    console.log("getChildren", element);
    return Promise.resolve([new ItemData()]);
  }
}

export class ItemData extends vscode.TreeItem {
  constructor() {
    // public readonly command?: vscode.Command // public readonly collapsibleState: vscode.TreeItemCollapsibleState, // private readonly version: string, // public readonly label: string,
    // super(label, collapsibleState);
    super("Hello", vscode.TreeItemCollapsibleState.Collapsed);

    // this.tooltip = `${this.label}-${this.version}`;
    // this.description = this.version;
  }

  //   iconPath = {
  //     light: path.join(
  //       __filename,
  //       "..",
  //       "..",
  //       "resources",
  //       "light",
  //       "dependency.svg"
  //     ),
  //     dark: path.join(
  //       __filename,
  //       "..",
  //       "..",
  //       "resources",
  //       "dark",
  //       "dependency.svg"
  //     ),
  //   };
  //
  //   contextValue = "";
}
