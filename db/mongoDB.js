import { MongoClient, ObjectId } from 'mongodb';

export default function mongoDB({
    dbName = 'WhatToWatch',
    userCollection = 'users',
    movieCollection = 'Movies',
    seriesCollection = 'Series',
    defaultUri = 'mongodb://localhost:27017/',
} = {}) {
    const me = {};
    const uri = process.env.MONGODB_URI || defaultUri;

    // Connect to MongoDB
    const connect = async () => {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(userCollection);
        const movies = db.collection(movieCollection);
        const series = db.collection(seriesCollection);
        
        return { client, db, users, movies, series };
    };

    // get watchlist 
    me.getWatchlist = async (userId) => {
        try {
            const { client, users } = await connect();
            const user = await users.findOne({ _id: new ObjectId(userId) });
            await client.close();
            
            return user ? (user.watchlist || []) : [];
        } catch (error) {
            console.error('Error getting watchlist:', error);
            throw error;
        }
    };

    // get usres
    me.getUsers = async () => {
        try {
            const { client, users } = await connect();
            const allUsers = await users.find({}).toArray();
            await client.close();
            
            return allUsers;
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    };

    // create user
    me.addUser = async (user) => {
        try {
            const { client, users } = await connect();
            const newUser = {
                ...user,
                watchlist: [], // Initialize empty watchlist
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await users.insertOne(newUser);
            await client.close();
            
            return result;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    };

    me.getUserByEmail = async (email) => {
        try {
            const { client, users } = await connect();
            const user = await users.findOne({ email: email.toLowerCase() });
            await client.close();
            
            return user;
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    };

    me.addToWatchlist = async (userId, movie) => {
        try {
            console.log('Adding to watchlist - userId:', userId, 'movie:', movie.title);
            const { client, users } = await connect();
            
            //prevent duplicates using set 
            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $addToSet: { 
                        watchlist: {
                            ...movie,
                            addedAt: new Date()
                        }
                    },
                    $set: { updatedAt: new Date() }
                }
            );
            
            console.log('Update result:', result);
            await client.close();
            return result;
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            throw error;
        }
    };

    me.removeFromWatchlist = async (userId, movieId) => {
        try {
            const { client, users } = await connect();
            
            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $pull: { watchlist: { id: parseInt(movieId) } },
                    $set: { updatedAt: new Date() }
                }
            );
            
            await client.close();
            return result;
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            throw error;
        }
    };

    // Return a single random movie without loading the full collection.
    me.getRandomMovie = async() => {
        try{
            const { client, movies } = await connect();
            const result = await  movies.aggregate([ { $sample: { size: 1 } } ]).toArray();
            await client.close();
            return result[0];
        }
        catch(error){
            console.error('Error getting random movie:', error);
            throw error;
        }
    }

    // Fetch a paginated slice of movies with safe defaults for page inputs.
    me.getMoviePage = async(page = 1, pageSize = 50) => {
        try{
            const { client, movies } = await connect();
            const parsedPage = parseInt(page, 10);
            const parsedPageSize = parseInt(pageSize, 10);
            const safePageSize = Number.isNaN(parsedPageSize) || parsedPageSize <= 0 ? 50 : parsedPageSize;
            const safePage = Number.isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;

            const totalMovies = await movies.countDocuments();
            const totalPages = Math.ceil(totalMovies / safePageSize);
            const validPage = totalPages === 0 ? 1 : Math.min(safePage, totalPages);
            const skip = (validPage - 1) * safePageSize;

            const moviePage = await movies.find({})
                .skip(skip)
                .limit(safePageSize)
                .toArray();

            await client.close();

            return {
                page: validPage,
                pageSize: safePageSize,
                totalMovies,
                totalPages,
                movies: moviePage
            };
        }
        catch(error){
            console.error('Error getting movie page:', error);
            throw error;
        }
    }

    // Fetch a paginated slice of series documents using the same guards as movies.
    me.getSeriesPage = async(page = 1, pageSize = 50) => {
        try{
            const { client, series } = await connect();
            const parsedPage = parseInt(page, 10);
            const parsedPageSize = parseInt(pageSize, 10);
            const safePageSize = Number.isNaN(parsedPageSize) || parsedPageSize <= 0 ? 50 : parsedPageSize;
            const safePage = Number.isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;

            const totalSeries = await series.countDocuments();
            const totalPages = Math.ceil(totalSeries / safePageSize);
            const validPage = totalPages === 0 ? 1 : Math.min(safePage, totalPages);
            const skip = (validPage - 1) * safePageSize;

            const seriesPage = await series.find({})
                .skip(skip)
                .limit(safePageSize)
                .toArray();

            await client.close();

            return {
                page: validPage,
                pageSize: safePageSize,
                totalSeries,
                totalPages,
                series: seriesPage
            };
        }
        catch(error){
            console.error('Error getting series page:', error);
            throw error;
        }
    }

    return me;
} 
