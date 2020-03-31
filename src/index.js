import https from 'https';
import http from 'http';

async function getRawVaultData(address, path, token) {
  return new Promise((resolve, reject) => {
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
}

async function getVaultValue(address, token, params, cb) {
  const [path, key] = params.split(' ');

  let timeout;

  const update = async () => {
    const { lease_duration, data } = await getRawVaultData(address, path, token);
    timeout = setTimeout(update, (2 / 3 * lease_duration) * 1000); // 2/3rds lease duration
    cb(data);
  };

  const { lease_duration, data } = await getRawVaultData(address, path, token);
  timeout = setTimeout(update, (2 / 3 * lease_duration) * 1000); // 2/3rds lease duration

  return {
    value: key ? data[key] : data,
    cancel: () => clearTimeout(timeout),
  };
}

export default function(address, token) {
  return async (params, watcher) => {
    return getVaultValue(address, token, params, watcher);
  };
}

