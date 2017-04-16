import * as express from 'express';
import * as mongodb from 'mongodb';
import * as morgan from 'morgan';

import {FoursquareStore} from './foursquare';
import * as opentable from './opentable';
import {RestaurantStore} from './restaurant';
import {Processor} from './processor';

async function setupServer(){
    const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/oracle';
    const db = await mongodb.MongoClient.connect(mongoURL);
    const fsStore = new FoursquareStore(db);
    const otStore = new opentable.OpenTableStore(db);
    const restStore = new RestaurantStore(db);
    const processor = new Processor(fsStore, otStore, restStore);
    const app: express.Express = express();
    app.use(morgan('dev'));
    app.get('/check-availability', async (req, res) => {
        console.log(req.query);
        const availability = await processor.checkRestaurants(
            req.query.covers, req.query.datetime);
        res.json(availability);
    });
    console.log('Server listening on port 3000');
    app.listen(3000);
}

if (require.main == module) {
    setupServer().catch((err) => {
        console.error(err);
    });
}