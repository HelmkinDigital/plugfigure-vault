import https from 'https';
import http from 'http';

async function getVaultValue(address, token, params, watcher) {
  const [path, key] = params.split(' ');
  const vaultRes = await new Promise((resolve, reject) => {
    const url = new URL(`/v1/${path}`, address);
    const options = {
      hostname: url.hostname,
      port: url.port,
      protocol: url.protocol,
      path: url.pathname,
      headers: {
        'X-Vault-Token': token,
      },
    };

    const listener = async (res) => {
      if (res.statusCode !== 200) return reject(res.statusMessage);

      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    };

    (url.protocol === 'https:' ? https : http).get(options, listener)
      .on('error', err => reject(err));
  });

  const {
    lease_duration,
    data,
  } = vaultRes;

  setTimeout(async () => {
    watcher(await getVaultValue(address, token, params, watcher));
  }, (2 * lease_duration / 3) * 1000); // 2/3rds lease duration

  return key ? data[key] : data;
}

export default function(address, token) {
  return async (params, watcher) => {
    return getVaultValue(address, token, params, watcher);
  };
}

