import express from 'express'
const app = express()
import http from 'http'
import cors from 'cors'
app.use(cors())
import {Server} from 'socket.io'
import { randomUUID } from 'crypto'
import fs from 'fs'

const server = http.createServer(app)


const sendRoomIdToFrontend = async (username) => {
    let obj, arr, element;

    obj = fs.readFileSync("./data.json", 'utf8')     // this is the correct way to read data
    console.log(obj, "obj")
    const parsedObj = JSON.parse(obj)
    arr = parsedObj.data
    console.log(arr, "arr")
    element = arr[0]

    if(element.currentRoomCount===3){
        // create new room
        const roomDetails = {
            roomId: randomUUID(),
            currentRoomCount: 1,
            usernames: [username]
        }

        arr.unshift(roomDetails)

        fs.writeFileSync("data.json", JSON.stringify({data: arr}))

        return roomDetails;
    }
    else{
        // add the user in the room
        element.currentRoomCount += 1
        element.usernames.push(username)
        arr[0] = element

        fs.writeFileSync("data.json", JSON.stringify({data: arr}))

        return element;
    }


}



const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`)

    socket.on('get_room_id', async (data) => {
        const roomData = await sendRoomIdToFrontend(data.username)
        socket.emit('get_room_id_from_backend', roomData)
    })
})

server.listen(5000, () => {
    console.log("Server is running....")
})