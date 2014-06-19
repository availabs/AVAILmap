# -*- coding: utf-8 -*-
"""
Created on Sun Mar 16 07:13:34 2014

@author: Eric Conklin
"""

# base Pythin modules
import SimpleHTTPServer, SocketServer

ADDRESS = 'localhost'
PORT = 80

class MyServer(SocketServer.ThreadingTCPServer):
    def __init__(self, *args, **kwargs):
        SocketServer.ThreadingTCPServer.__init__(self, *args, **kwargs)
    #end __init__
#end MyServer

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        SimpleHTTPServer.SimpleHTTPRequestHandler.__init__(self, *args, **kwargs)
    #end __init__
#end MyHandler
        
def main():
    server = MyServer((ADDRESS, PORT), MyHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()