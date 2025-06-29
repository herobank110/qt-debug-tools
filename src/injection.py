"""Script to inject into the debug qt app to collect and emit data."""


def __qt_debug_tools_entry():
    import json
    import socket
    from qtpy.QtCore import Qt
    from qtpy.QtWidgets import QApplication, QWidget

    def collect_data():
        """Collect data from the Qt application."""

        app = QApplication.instance()
        if app is None:
            raise RuntimeError("No QApplication instance found.")

        # Collect top-level widgets
        top_level_widgets = app.topLevelWidgets()
        return list(map(recursive_collect, top_level_widgets))

    def recursive_collect(widget):
        """Recursively collect data from a widget."""

        # filter out non-widget objects
        child_widgets = widget.findChildren(
            QWidget, options=Qt.FindChildOption.FindDirectChildrenOnly
        )

        return {
            "class": type(widget).__name__,
            "objectName": widget.objectName(),
            "children": list(map(recursive_collect, child_widgets)),
        }

    connection = socket.create_connection(("localhost", 41329))
    data = collect_data()
    connection.send(json.dumps(data).encode())
    connection.close()


__qt_debug_tools_entry()
