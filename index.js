require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

        // await client.connect();

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



        app.get('/watchListReview', async (req, res) => {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send({ error: "User email is required" });
            }

            const reviews = await watchlistCollection.find({ userEmail: email }).toArray();
            res.send(reviews);
        });



        app.get('/review/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const review = await gameCollection.findOne(query);
            res.send(review);
        });



        app.get('/watchListReview/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const review = await watchlistCollection.findOne(query);
            res.send(review);
        });



        // Fetch all reviews
        app.get('/review', async (req, res) => {
            const cursor = gameCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        



      // Get the user's watchlist by email
      

     


    
    


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



        app.delete('/watchListReview/:id', async (req, res) => {
            const {id} = req.params;
            const result = await gameCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        


        




        // Confirm MongoDB connection
        // await client.db('admin').command({ ping: 1 });
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

















app.post('/request-volunteer', async (req, res) => {
    const requestData = req.body;

    try {
       
        const result = await requestsCollection.insertOne(requestData);

        if (result.insertedId) {
          
            const requestDoc = await requestsCollection.findOne({ _id: result.insertedId });

            if (!requestDoc) {
                return res.status(404).json({ message: 'Request not found.' });
            }

           
            if (typeof requestDoc.volunteersNeeded !== 'number') {
                await requestsCollection.updateOne(
                    { _id: result.insertedId },
                    { $set: { volunteersNeeded: parseInt(requestDoc.volunteersNeeded, 10) } }
                );
            }

           
            const updateResult = await requestsCollection.updateOne(
                { _id: result.insertedId },
                { $inc: { volunteersNeeded: -1 } }
            );

            if (updateResult.modifiedCount === 1) {
                return res.status(200).json({ message: 'Request successfully submitted and updated', insertedId: result.insertedId });
            } else {
                return res.status(400).json({ message: 'Failed to update request count.' });
            }
        } else {
            return res.status(400).json({ message: 'Failed to submit request. Please try again.' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error while processing the request.' });
    }
});














import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../provider/AuthProvider';
import toast from 'react-hot-toast';

const VolunteerRequestForm = ({propPost}) => {

    const navigate = useNavigate()

   
    const { id } = useParams(); 
    const [postData, setPostData] = useState(null);  // Renamed local state to postData
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [suggestion, setSuggestion] = useState('');

    const { user } = useContext(AuthContext); 

    // Only fetch data if no post data is passed as a prop
    useEffect(() => {
        if (!propPost) {
            axios
                .get(`http://localhost:5000/volunteers/${id}`)
                .then((response) => {
                    setPostData(response.data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error fetching post:', err);
                    setError(err.response?.data?.message || 'Failed to load post');
                    setLoading(false);
                });
        } else {
            setPostData(propPost);  // Use the prop post if it's passed
            setLoading(false);
        }
    }, [id, propPost]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!suggestion.trim()) {
            toast.error('Please enter a suggestion.');
            return;
        }

        const volunteersNeeded = parseInt(postData.volunteersNeeded, 10);

        if (isNaN(volunteersNeeded)) {
            toast.error('Invalid volunteersNeeded value. It should be a number.');
            return;
        }

        const requestData = {
            volunteerPostId: id,
            volunteerName: user.displayName || 'user', 
            volunteerEmail: user.email,
            suggestion: suggestion.trim(),
            thumbnail: postData.thumbnail,
            title: postData.title,
            description: postData.description,
            category: postData.category,
            location: postData.location,
            volunteersNeeded: volunteersNeeded,
            deadline: postData.deadline,
            organizerName: postData.organizerName,
            organizerEmail: postData.organizerEmail,
        };

        console.log('Request Data:', requestData);

        fetch('http://localhost:5000/request-volunteer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('Server Response:', data);  

                if (data && data.insertedId) {
                    toast.success('Request post successfully added');
                    navigate('/')
                   
                  
                   
                } else {
                    toast.error('Failed to submit request. Please try again.');
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="max-w-lg mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-10">
            <h1 className="text-2xl font-bold text-indigo-700 mb-4">Volunteer Request</h1>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label><strong>Thumbnail:</strong></label>
                    <img src={postData.thumbnail} alt={postData.title} className="w-full h-40 object-cover rounded-md mb-4" />
                </div>

                <div className="mb-4">
                    <label><strong>Post Title:</strong></label>
                    <input type="text" value={postData.title} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Description:</strong></label>
                    <textarea value={postData.description} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Category:</strong></label>
                    <input type="text" value={postData.category} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Location:</strong></label>
                    <input type="text" value={postData.location} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>No. of Volunteers Needed:</strong></label>
                    <input type="number" value={postData.volunteersNeeded} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Deadline:</strong></label>
                    <input type="text" value={new Date(postData.deadline).toLocaleDateString()} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Organizer Name:</strong></label>
                    <input type="text" value={postData.organizerName} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Organizer Email:</strong></label>
                    <input type="email" value={postData.organizerEmail} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Volunteer Name:</strong></label>
                    <input type="text" value={user.displayName || 'user'} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Volunteer Email:</strong></label>
                    <input type="email" value={user.email} readOnly className="w-full p-2 border rounded mt-1" />
                </div>

                <div className="mb-4">
                    <label><strong>Your Suggestion:</strong></label>
                    <textarea
                        className="w-full p-2 border rounded mt-1"
                        placeholder="Your suggestion"
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                    />
                </div>

                <button
                    className="mt-4 px-6 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800"
                >
                    Request
                </button>

            </form>
        </div>
    );
};

export default VolunteerRequestForm;




git rm - r--cached node_modules .env
git commit - am "node_modules be gone!"
git push origin main







import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const VolunteerPostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    axios
      .get(`http://localhost:5000/volunteers/${id}`)
      .then((response) => {
        setPost(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
        setLoading(false);
      });
  }, [id]);

  const handleButtonClick = () => {
    // Navigate to the new page for volunteer request, passing post ID
    navigate(`/volunteer-request/${id}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-10">
        <Helmet>
                <title>VolunteerPostDetails - Volunteer-management</title>
            </Helmet>
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">{post.title}</h1>
      <img
        src={post.thumbnail}
        alt={post.title}
        className="w-full h-60 object-cover rounded-lg mb-6"
      />
      <p className="text-gray-600 mb-4">
        <strong>Category:</strong> {post.category}
      </p>
      <p className="text-gray-600 mb-4">
        <strong>Location:</strong> {post.location}
      </p>
      <p className="text-gray-600 mb-4">
        <strong>Volunteers Needed:</strong> {post.volunteersNeeded}
      </p>
      <p className="text-gray-600 mb-4">
        <strong>Deadline:</strong> {new Date(post.deadline).toLocaleDateString()}
      </p>
      <p className="text-gray-600 mb-4">
        <strong>Description:</strong> {post.description}
      </p>
      <button
        onClick={handleButtonClick}
        className="px-6 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 mt-4"
      >
        Be a Volunteer
      </button>
    </div>
  );
};

export default VolunteerPostDetail;








import React, { useContext, useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../provider/AuthProvider';
import { FaPersonFalling } from 'react-icons/fa6';
import { FaMoon, FaSun } from 'react-icons/fa';
import { ThemeContext } from '../../provider/themeContext/ThemeProvider';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logOut } = useContext(AuthContext);
    const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
    const [isHovered, setIsHovered] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const location = useLocation();

    const handleThemeToggle = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location]);

    const handleLogOut = () => {
        logOut()
            .then(() => {
                console.log('Successfully signed out');
                navigate('/');
            })
            .catch((error) => {
                console.error('Failed to sign out:', error.message);
            });
    };

    const linkClasses = ({ isActive }) =>
        isActive
            ? 'text-indigo-700 font-semibold '
            : 'hover:text-indigo-600';

    return (
        <nav className="bg-white dark:bg-gray-800 text-black dark:text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">

                {/* Logo */}
                <div className="text-2xl text-indigo-700 font-semibold cursor-pointer flex items-center gap-1">
                    <FaPersonFalling />
                    <NavLink to="/">Volunteero</NavLink>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-3">
                    <NavLink to="/" className={linkClasses}>
                        Home
                    </NavLink>
                    <NavLink to="/allVolunteer" className={linkClasses}>
                        All Volunteer
                    </NavLink>

                    <NavLink to="/myVolunteerRequestPost" className={linkClasses}>
                        My Volunteer Request Post
                    </NavLink>

                    <NavLink to="/blogSection" className={linkClasses}>
                        Blog
                    </NavLink>

                    <NavLink to="/contactUs" className={linkClasses}>
                        Contact Us
                    </NavLink>



                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className="hover:text-indigo-700"
                        >
                            My Profile
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-10">
                                <NavLink
                                    to="/addVolunteer"
                                    className="block px-4 py-2 hover:text-indigo-500"
                                >
                                    Add Volunteer need Post
                                </NavLink>
                                <NavLink
                                    to="/manageMyPosts"
                                    className="block px-4 py-2 hover:text-indigo-500"
                                >
                                    Manage My Posts
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="relative">
                        {user ? (
                            <div className="relative flex items-center gap-3 cursor-pointer">

                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(true)}
                                >
                                    <img
                                        src={user.photoURL}

                                        className="w-10 h-10 rounded-full border-2 border-indigo-700"
                                    />

                                    {isHovered && (
                                        <div className="absolute top-12 left-0 z-10 bg-gray-400 text-white px-2 py-1 rounded-md shadow-lg">
                                            <div className="mb-2 px-2 w-[100px]">{user.displayName || 'User'}</div>
                                            <button
                                                onClick={handleLogOut}
                                                className="w-full px-2 py-2 bg-indigo-700 rounded-lg text-white font-semibold"
                                            >
                                                Log Out
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleLogOut}
                                    className="px-4 py-2 bg-indigo-700 rounded-lg text-white font-semibold"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (

                            <Link
                                to="/auth/login"
                                className="px-4 py-2 bg-indigo-700 rounded-lg text-white font-semibold"
                            >
                                Login
                            </Link>
                        )}


                    </div>

                    <button onClick={handleThemeToggle} className="text-xl p-2">
                        {isDarkMode ? <FaSun /> : <FaMoon />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 