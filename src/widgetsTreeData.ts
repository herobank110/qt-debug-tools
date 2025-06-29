import * as vscode from "vscode";
import * as net from "net";

type ReceivedWidgetDataOne = {
  class: string;
  objectName: string;
  children: ReceivedWidgetDataOne[];
};

type ReceivedWidgetData = ReceivedWidgetDataOne[];

export class WidgetsTreeDataProvider
  implements vscode.TreeDataProvider<WidgetTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    WidgetTreeItem | undefined | void
  > = new vscode.EventEmitter<WidgetTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<WidgetTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private debugSession: vscode.DebugSession | undefined;

  /**
   * Id of thread obtained through stack trace.
   *
   * Cached because it is slow to fetch.
   */
  private lastFrameId: string | undefined;

  /**
   * Interval key for refreshing the tree data.
   */
  private refreshIntervalToken: NodeJS.Timeout | undefined;

  /** Server to communicate data from process. */
  private server: net.Server;

  /** Widgets data received from python process. */
  private receivedWidgetData: ReceivedWidgetData | undefined;

  constructor(private context: vscode.ExtensionContext) {
    // Listen for debug session changes
    context.subscriptions.push(
      vscode.debug.onDidStartDebugSession((session) => {
        this.debugSession = session;
        this.lastFrameId = undefined; // Reset lastThreadId
        // TODO: change to retry interval exponential backoff?
        setTimeout(() => {
          // this.refreshIntervalToken = setInterval(() => {
          //   this.refresh();
          // }, 1000);
          this.injectScript();
        }, 1000);
      })
    );

    context.subscriptions.push(
      vscode.debug.onDidTerminateDebugSession(() => {
        this.debugSession = undefined;
        if (this.refreshIntervalToken) {
          clearInterval(this.refreshIntervalToken);
          this.refreshIntervalToken = undefined;
        }
        this.refresh();
      })
    );

    this.server = net.createServer();
    this.server.listen(41329, "localhost", () => {
      console.log("Server listening on port 41329");
    });
    this.server.on("connection", this.onServerConnection.bind(this));
    context.subscriptions.push(new vscode.Disposable(this.server.close));
  }

  private onServerConnection(socket: net.Socket): void {
    socket.on("data", (data) => {
      const message = data.toString();
      this.receivedWidgetData = JSON.parse(message);
      this._onDidChangeTreeData.fire();
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  }

  refresh(): void {
    this.injectScript();
    // this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WidgetTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WidgetTreeItem): Thenable<WidgetTreeItem[]> {
    if (!this.debugSession) {
      const NO_ACTIVE_DEBUG_SESSION_ITEM = new WidgetTreeItem({
        class: "No active debug session",
        objectName: "",
        children: [],
      });
      return Promise.resolve([NO_ACTIVE_DEBUG_SESSION_ITEM]);
    }
    if (!this.receivedWidgetData) {
      throw new Error("No widget data received");
    }

    if (!element) {
      // Root level - execute simple Python expressions to demonstrate capability
      // return this.executePythonExpressions();
      const items = this.receivedWidgetData.map((x) => new WidgetTreeItem(x));
      return Promise.resolve(items);
    } else {
      return Promise.resolve(
        element.received.children.map((x) => new WidgetTreeItem(x))
      );
    }

    // For child elements, you can implement specific logic
    return Promise.resolve([]);
  }

  private async injectScript() {
    if (!this.debugSession) {
      return;
    }

    // TODO: use refloader to bundle python script in dist folder properly
    // https://www.npmjs.com/package/ref-loader
    const scriptPath = __dirname + "/../src/injection.py";
    const expression = `exec(open(r"${scriptPath.replace(
      /\\/g,
      "/"
    )}").read())`;

    console.log("Injecting script:", scriptPath);
    const result = await this.debugSession.customRequest("evaluate", {
      expression,
      context: "repl",
    });
    console.log(result);
  }

  // private async executePythonExpressions(): Promise<ItemData[]> {
  //   if (!this.debugSession) {
  //     return [];
  //   }

  //   try {
  //     const results: ItemData[] = [];

  //     // Simple Python expressions to demonstrate execution capability
  //     const expressions = [
  //       "2*3",
  //       "len('hello')",
  //       "__import__('sys').version_info.major",
  //       "__import__('qtpy').QtCore.QCoreApplication",
  //     ];

  //     const threads = await this.debugSession.customRequest("threads");
  //     const threadId: any = threads.threads.find(
  //       (x: any) => x.name === "MainThread"
  //     )?.id;
  //     if (!threadId) {
  //       throw new Error("MainThread not found");
  //     }

  //     if (this.lastFrameId === undefined) {
  //       const stackTraceResult = await this.debugSession.customRequest(
  //         "stackTrace",
  //         { threadId }
  //       );
  //       const frameId = stackTraceResult.stackFrames[0].id;
  //       this.lastFrameId = frameId;
  //     }
  //     const frameId = this.lastFrameId;

  //     // sort of works but not on initialization. need to wait a moment
  //     // to let main debugpy extension initialize so puyt it on a timer!
  //     await this.debugSession.customRequest("pause", { threadId });

  //     for (const expression of expressions) {
  //       try {
  //         const response = await this.debugSession.customRequest("evaluate", {
  //           expression,
  //           frameId,
  //           context: "watch",
  //         });
  //         const result = response.result;
  //         results.push(new ItemData(`${expression}`, `= ${result}`));
  //       } catch (error) {
  //         results.push(new ItemData(`${expression}`, `Error: ${error}`));
  //       }
  //     }

  //     // not working for some reason...
  //     // setTimeout(() => {
  //     //   this.debugSession!.customRequest("continue", { threadId });
  //     // }, 100);

  //     return results.length > 0 ? results : [new ItemData("No results", "")];
  //   } catch (error) {
  //     console.error("Error executing Python expressions:", error);
  //     return [new ItemData("Error")];
  //   }
  // }

  // private async evaluatePythonExpression(expression: string): Promise<any> {
  //   if (!this.debugSession) {
  //     throw new Error("No active debug session");
  //   }

  //   try {
  //     // Send evaluate request to debug adapter

  //     return response.result;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}

export class WidgetTreeItem extends vscode.TreeItem {
  constructor(public received: ReceivedWidgetDataOne) {
    super("");
    this.label = received.class;
    this.description = received.objectName || undefined;
    this.collapsibleState =
      received.children.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed;
    // this.tooltip = `${label}: ${description}`;
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
