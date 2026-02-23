/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const files = {
  'index.js': {
    file: {
      contents: `import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
    res.send(\`<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .card {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        h1 { margin-top: 0; }
        .status { 
            display: inline-block; 
            padding: 5px 15px; 
            background: #00d084; 
            border-radius: 20px; 
            font-size: 0.9rem;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 WebContainer App Running!</h1>
        <p>Your Express server is successfully running inside a WebContainer.</p>
        <span class="status">● Server Active</span>
        <p style="margin-top: 20px; opacity: 0.9;">
            Edit <code>index.js</code> in the editor to see live updates!
        </p>
    </div>
</body>
</html>\`);
});

app.listen(port, () => {
    console.log('App is live at http://localhost:' + port);
});`,
    },
  },
  'package.json': {
    file: {
      contents: JSON.stringify({
        "name": "example-app",
        "version": "1.0.0",
        "type": "module",
        "dependencies": {
          "express": "^4.18.2"
        },
        "scripts": {
          "start": "node index.js"
        }
      }, null, 2),
    },
  },
  'package-lock.json': {
    file: {
      contents: JSON.stringify({
        "name": "example-app",
        "version": "1.0.0",
        "lockfileVersion": 3,
        "requires": true,
        "packages": {
          "": {
            "name": "example-app",
            "version": "1.0.0",
            "dependencies": {
              "express": "^4.18.2"
            }
          }
        }
      }, null, 2),
    },
  },
};
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class=\"card\">
        <h1>🚀 WebContainer App Running!</h1>
        <p>Your Express server is successfully running inside a WebContainer.</p>
        <span class=\"status\">● Server Active</span>
        <p style=\"margin-top: 20px; opacity: 0.9;\">
            Edit <code>index.js</code> in the editor to see live updates!
        </p>
    </div>
</body>
</html>\`);
});

app.listen(port, () => {
    console.log(\\`✅ App is live at http://localhost:\\${port}\\`);
});`,
    },
  },
  'package.json': {
    file: {
      contents: JSON.stringify({
        "name": "example-app",
        "version": "1.0.0",
        "type": "module",
        "dependencies": {
          "express": "^4.18.2"
        },
        "scripts": {
          "start": "node index.js"
        }
      }, null, 2),
    },
  },
  // KEY FIX: Including package-lock.json prevents installation hanging
  // It allows Turbo to skip lockfile generation and install directly
  'package-lock.json': {
    file: {
      contents: JSON.stringify({
        "name": "example-app",
        "version": "1.0.0",
        "lockfileVersion": 3,
        "requires": true,
        "packages": {
          "": {
            "name": "example-app",
            "version": "1.0.0",
            "dependencies": {
              "express": "^4.18.2"
            }
          }
        }
      }, null, 2),
    },
  },
};
