import { Browser, KeyInput, MouseWheelOptions, Page } from 'puppeteer';
import extra from 'puppeteer-extra';
const puppeteer = extra.default;
import pluginStealth from 'puppeteer-extra-plugin-stealth';
puppeteer.use(pluginStealth());

import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

io.on('connection', async socket => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--enable-gpu",
      "--no-sandbox"
    ]
  });
  const page = await browser.newPage();
  await page.setBypassCSP(true);

  await page.goto('https://www.google.com/');

  socket.on('viewport', async (width: number, height: number) => {
    await page.setViewport({width, height});
  });

  socket.on('keydown', async (key: KeyInput) => {
    try {
      await page.keyboard.press(key);
    } catch {};
  });

  socket.on('mousedown', async (btn: number) => {
    try {
      await page.mouse.down({
        button: btn == 0 ? 'left' : btn == 2 ? 'right' : 'middle'
      });
    } catch {};
  });

  socket.on('mouseup', async (btn: number) => {
    try {
      await page.mouse.up({
        button: btn == 0 ? 'left' : btn == 2 ? 'right' : 'middle'
      });
    } catch {};
  });

  socket.on('mousemove', async (x: number, y: number) => {
    try {
      await page.mouse.move(x, y);
    } catch {};
  });

  socket.on('scroll', async (deltaX: number, deltaY: number) => {
    await page.mouse.wheel({ deltaX, deltaY });
  });
  
  let timing = false;
  while (true) {
    try {
      socket.emit('screenshot', await page.screenshot({ encoding: 'base64' }));
      if (timing) {
        console.timeEnd("Page Reload");
        timing = false;
      }
    } catch {
      if (!timing) {
        console.time("Page Reload");
        timing = true;
      }
    }
  }
});

server.listen(3000);

process.on("SIGINT", () => {
  process.exit();
});
