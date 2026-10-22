# Measuring Subway Surfers gameplay

Used to replace 🧪 placeholder numbers in `src/rules/baseline.js` with values measured from the
official web version (Poki, by SYBO). Runs on a desktop with Python 3 (+ Pillow) and the Playwright MCP.

## 1. Start the frame receiver

The Playwright code sandbox can't write files, so frames are POSTed to a tiny local server:

```sh
python -I tools/measure/receiver.py <output-folder>      # listens on 127.0.0.1:8765
```

## 2. Record frames (Playwright `browser_run_code_unsafe`)

Open https://poki.com/en/g/subway-surfers (1280×800 viewport; the game sits at about x 160–996,
y 16–486), start a run, then record while pressing keys at known times:

```js
async (page) => {
  const cdp = await page.context().newCDPSession(page);
  const saves = [];
  cdp.on('Page.screencastFrame', (f) => {
    saves.push(fetch(`http://127.0.0.1:8765/?dir=jump&name=${f.metadata.timestamp.toFixed(3)}.jpg`,
      { method: 'POST', body: f.data }).catch(() => 'err'));
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  await page.waitForTimeout(200);
  const up = Date.now() / 1000; await page.keyboard.press('ArrowUp');   // the event to measure
  await page.waitForTimeout(1300);
  await cdp.send('Page.stopScreencast');
  await Promise.all(saves);
  return { up };   // reference time for the contact sheet
}
```

Frame file names are their timestamps (seconds), ~59 frames per second.

## 3. Make a contact sheet and read it

```sh
python -I tools/measure/sheet.py <folder>/jump sheet.png <ref_time> <every_nth> <x0,y0,x1,y1> <from_s> <to_s>
```

Each tile is labeled with its time relative to `ref_time`. Read take-off/landing, lane-change start/end etc.
from the labels.

## Gotchas

- Poki plays a video ad before some runs; wait it out and check a screenshot before recording.
- Nobody steers between recordings, so runs crash within seconds: measure right after a run starts.
- Right after PLAY there's an intro leap over a train; wait ~4 s before measuring moves.
- The camera follows the runner (up on jumps, sideways on lane changes): judge by the shadow and
  track, not by the runner's screen position. Absolute speed isn't measurable; timings are.
