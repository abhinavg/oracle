import {Db, ObjectID} from 'mongodb';

import * as http from './http';
import * as opentable from './opentable';

interface FoursquareLocation {
	postalCode: string;
}

export type FoursquareID = string;

export interface FoursquareVenue {
	id: FoursquareID;
	name: string;
	location: FoursquareLocation;	
}

export class FoursquareStore {
    db: Db;
	collection = 'fs_venues';

	constructor(db: Db) {
		this.db = db;
	}

    async put(venue: FoursquareVenue): Promise<FoursquareVenue> {
        const res = await this.db.collection(this.collection).insertOne(venue);
		return venue;
    }

    async get(id: FoursquareID): Promise<FoursquareVenue|null> {
        return this.db.collection(this.collection).findOne({'id': id});
    }
}

export async function getSavedVenues(uri: string):Promise<FoursquareVenue[]> {
	const qs = {
		oauth_token: process.env.FS_OAUTH_TOKEN,
		v: '20170130',
		limit: 200,
	};
	const fs_options = {
		uri: uri,
		qs: qs,
		json: true,
	};
	const body = await http.requestWrapper(fs_options);
	const venues: FoursquareVenue[] = [];
	for(let item of body.response.list.listItems.items) {
		if (<FoursquareVenue>(item.venue)) {
			venues.push(item.venue);
		} else {
			console.warn(`Item ${JSON.stringify(item)} is not of type 'venue'`);
		}
	}
	return venues;
}

export async function findOpenTableLink(fsID: FoursquareID):Promise<number|null> {
	const options = {
		uri: `https://api.foursquare.com/v2/venues/${fsID}/links`,
		qs: {v: '20170130', oauth_token: process.env.FS_OAUTH_TOKEN},
		json: true
	}
	const body = await http.requestWrapper(options);
	let otID: number|null = null;
	for(let link of body.response.links.items) {
		if (link.provider.id == 'opentable'){
			otID = Number(link.linkedId);
			break;
		}
	}
	return otID;
}