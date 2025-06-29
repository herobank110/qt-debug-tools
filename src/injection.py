"""Script to inject into the debug qt app to collect and emit data."""

import socket

connection = socket.create_connection(("localhost", 41329))
connection.send(b"Hello")
