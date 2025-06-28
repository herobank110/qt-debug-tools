import * as vscode from "vscode";

export class ElementsTreeDataProvider
  implements vscode.TreeDataProvider<ItemData>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ItemData | undefined | void
  > = new vscode.EventEmitter<ItemData | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ItemData | undefined | void> =
    this._onDidChangeTreeData.event;

  private debugSession: vscode.DebugSession | undefined;

  constructor(private context: vscode.ExtensionContext) {
    // Listen for debug session changes
    context.subscriptions.push(
      vscode.debug.onDidStartDebugSession((session) => {
        this.debugSession = session;
        this.refresh();
      })
    );

    context.subscriptions.push(
      vscode.debug.onDidTerminateDebugSession(() => {
        this.debugSession = undefined;
        this.refresh();
      })
    );

    // Set current debug session if already active
    this.debugSession = vscode.debug.activeDebugSession;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ItemData): vscode.TreeItem {
    console.log("getTreeItem", element);
    return element;
  }

  getChildren(element?: ItemData): Thenable<ItemData[]> {
    if (!this.debugSession) {
      return Promise.resolve([new ItemData("No active debug session", "")]);
    }

    console.log("getChildren", element);

    if (!element) {
      // Root level - execute simple Python expressions to demonstrate capability
      return this.executePythonExpressions();
    }

    // For child elements, you can implement specific logic
    return Promise.resolve([]);
  }

  private async executePythonExpressions(): Promise<ItemData[]> {
    if (!this.debugSession) {
      return [];
    }

    try {
      const results: ItemData[] = [];

      // Simple Python expressions to demonstrate execution capability
      const expressions = [
        "a = 1+1",
        "2*3",
        "len('hello')",
        "import sys; sys.version_info.major",
      ];

      for (const expr of expressions) {
        try {
          const result = await this.evaluatePythonExpression(expr);
          results.push(new ItemData(`${expr}`, `= ${result}`));
        } catch (error) {
          results.push(new ItemData(`${expr}`, `Error: ${error}`));
        }
      }

      return results.length > 0 ? results : [new ItemData("No results", "")];
    } catch (error) {
      console.error("Error executing Python expressions:", error);
      return [new ItemData("Error", "Failed to execute Python expressions")];
    }
  }

  private async evaluatePythonExpression(expression: string): Promise<any> {
    if (!this.debugSession) {
      throw new Error("No active debug session");
    }

    try {
      // Send evaluate request to debug adapter
      const threads = await this.debugSession.customRequest("threads");
      const threadId: any = threads.threads.find(
        (x: any) => x.name === "MainThread"
      )?.id;
      if (!threadId) {
        throw new Error("MainThread not found");
      }
      const stackTraceResult = await this.debugSession.customRequest(
        "stackTrace",
        {
          threadId,
        }
      );
      const frameId = stackTraceResult.stackFrames[0].id;

      const response = await this.debugSession.customRequest("evaluate", {
        expression,
        frameId,
        context: "watch",
      });
      return response.result;
    } catch (error) {
      throw error;
    }
  }
}

export class ItemData extends vscode.TreeItem {
  constructor(
    label: string = "Hello",
    description: string = "",
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = `${label}: ${description}`;
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
