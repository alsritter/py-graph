import server
import asyncio
import webbrowser

if __name__ == '__main__':
    server = server.PyGraphServer()
    server.add_routes()
    webbrowser.open('http://127.0.0.1:5000')
    loop = asyncio.get_event_loop()
    loop.run_until_complete(server.start('127.0.0.1', 5000))
    loop.run_forever()
