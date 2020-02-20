import https from 'https';

export default function(options) {
  return async (params, watcher) => {
    const [path, key] = params.split(' ');
    const resBody = await new Promise((resolve, reject) => {
      https.request({
        ...options,
        params,
      }, (res) => {
        if (res.statusCode !== 200) return reject(res.statusMessage);

        let data = '';
        for await (const chunk of res) {
          data += chunk;
        }
        resolve(data);
      });
    });

    console.log(resBody);
  };
}

