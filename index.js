const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.crj7d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
    await client.connect();

    // Database and Collections
    const gameCollection = client.db('gameDB').collection('game');
    const watchlistCollection = client.db('gameDB').collection('watchlist');


    app.get('/userReviews', async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).send({ error: "User email is required" });
        }
    
        const reviews = await gameCollection.find({ userEmail: email }).toArray();
        res.send(reviews);
    });


    app.get('/review/:id', async (req, res) => {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const review = await gameCollection.findOne(query);
        res.send(review);
      });

    // Fetch all reviews
    app.get('/review', async (req, res) => {
      const cursor = gameCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Add a new review
    app.post('/addReview', async (req, res) => {
      const game = req.body;
      console.log('New Game Review:', game);

      const result = await gameCollection.insertOne(game);
      res.send(result);
    });

   
    

    // Add review to watchlist
    app.post('/watchlist', async (req, res) => {
      const { review, userEmail, userName } = req.body;

      

      const watchlistItem = {
        ...review,
        userEmail,
        userName
       
      };

      const result = await watchlistCollection.insertOne(watchlistItem);
      res.send(result);
    });

   

    app.put('/review/:id', async (req, res) => {
        const { id } = req.params;
        const updatedReview = req.body;
    
       
        delete updatedReview._id;
    
        const result = await gameCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedReview }
        );
    
        res.send(result);
    });


    app.delete('/review/:id', async (req, res) => {
        const id = req.params.id;
        const result = await gameCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    });

    // Confirm MongoDB connection
    await client.db('admin').command({ ping: 1 });
    console.log('Successfully connected to MongoDB');
  } finally {
    // Keep the connection open for the server
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Game Review Server is running');
});


app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
