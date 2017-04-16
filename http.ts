import * as request from 'request';

export async function requestWrapper(options):Promise<any>{
	return new Promise((resolve, reject) => {
		request(options, (err, resp, body) => {
			if (err) {
				return reject(err);
			}
			if (resp.statusCode != 200) {
				return reject(new Error(`Received status ${resp.statusCode} for request ${JSON.stringify(options)}
				Body: ${JSON.stringify(body)}`));
			}
			return resolve(body);
		});
	});
}