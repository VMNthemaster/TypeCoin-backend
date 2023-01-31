import express from 'express'
const app = express()
import http from 'http'
import cors from 'cors'
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
import {Server} from 'socket.io'
import { randomUUID } from 'crypto'
import fs from 'fs'

const router = express.Router()
app.use('/', router)

const server = http.createServer(app)

router.post('/getRoomData', (req, res) => {
    const {username} = req.body;
    let obj, arr, element;

    obj = fs.readFileSync("./data.json", 'utf8')     // this is the correct way to read data
    const parsedObj = JSON.parse(obj)
    arr = parsedObj.data
    element = arr[0]

    if(element.currentRoomCount===3){
        // create new room
        const roomDetails = {
            roomId: randomUUID(),
            currentRoomCount: 1,
            playState: false,
            usernames: {
                player1: username,
                player2: '',
                player3: ''
            }
        }

        arr.unshift(roomDetails)

        fs.writeFileSync("data.json", JSON.stringify({data: arr}))

        return res.status(200).json(roomDetails)
    }
    else{
        // add the user in the room
        element.currentRoomCount += 1
        element.usernames[`player${element.currentRoomCount}`] = username
        if(element.currentRoomCount === 3){
            element.playState = true
        }
        arr[0] = element

        fs.writeFileSync("data.json", JSON.stringify({data: arr}))

        return res.status(200).json(element)

    }
})



const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`)

    socket.on("join_room", (data) => {
        console.log("room joined")
        socket.join(`${data.roomId}`)
    })

    socket.on('get_sentence_from_first_player', (data) => {
        console.log("hi1")
        socket.to(`${data.roomId}`).emit('get_sentence_from_first_player_backend')
    })

    socket.on('send_sentence_to_room', (data) => {
        console.log("reached here")
        socket.to(`${data.roomId}`).emit('send_sentence_to_room_backend', data)
    })
})

server.listen(5000, () => {
    console.log("Server is running....")
})