/**
 * app/version.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The one place the release number is written down.
 *
 * WHY A WHOLE FILE FOR ONE STRING
 *   Because the number has a job. There is no server, no analytics and no
 *   crash reporting, so when someone says "it does the wrong thing", the only
 *   fact available about which code is on their phone is the number printed
 *   at the bottom of the Me tab. If that number is wrong, every support
 *   conversation starts from a false premise.
 *
 * TWO PLACES MUST MOVE TOGETHER ON EVERY RELEASE
 *   1. APP_VERSION below.
 *   2. The CACHE string at the top of sw.js.
 *   The second is what actually delivers the update; the first is what tells
 *   a human which update they got. They are separate because a service worker
 *   is not an ES module and cannot import this file.
 */

export const APP_VERSION = '1.6.0';
