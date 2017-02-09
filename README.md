# lti-first

clone and then run
```
npm install
npm start
```
then go here to try

https://byui.brightspace.com/d2l/le/content/10011/Home?itemIdentifier=D2L.LE.Content.ContentObject.ModuleCO-3478491

it will return html from the link but have not got to what we need for iframes

It looks like we need to do a redirect `http 303` perhaps


npm express does res.redirect(303, url);

https://expressjs.com/en/api.html#res.redirect

I found that from the code in the ims-lti content extension 
