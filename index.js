const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req,res)=>{
    res.send('game review server is running');
})


app.listen(port, ()=>{
    console.log(`game sever is running on port : ${port}`)
})