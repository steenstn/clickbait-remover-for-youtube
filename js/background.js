let noRedirectToken = 'zctf420otaqimwn9lx8m';
let redirectListener = null;
let error404Listener = null;


chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
    tabs.forEach(function (tab) {
        chrome.tabs.insertCSS(tab.id, {
            file: 'css/youtube.css'
        });
        chrome.tabs.executeScript(tab.id, {
            file: 'js/replaceThumbnails.js'
        })
    })
});

chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {
    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file)
});

chrome.runtime.onInstalled.addListener(function () {
    // default values
    chrome.storage.sync.set({
        preferred_thumbnail_file: 'hq1',
        video_title_format: 'lowercase'
    })
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.preferred_thumbnail_file !== undefined) {
        removeThumbnailRedirectListeners();

        if (changes.preferred_thumbnail_file.newValue !== 'default') {
            setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
        }
    }
});

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    chrome.webRequest.onBeforeRequest.addListener(
        redirectListener = function (details) {
            if (!details.url.includes(`&noRedirectToken=${noRedirectToken}`)) {
                return {redirectUrl: details.url.replace('hqdefault.jpg', `${preferredThumbnailFile}.jpg`)};
            }
        },
        {
            urls: ['https://i.ytimg.com/vi/*/hqdefault.jpg*'],
            types: ['image']
        },
        ['blocking']
    );

    chrome.webRequest.onHeadersReceived.addListener(
        error404Listener = function (details) {
            if (details.statusCode === 404) {
                return {redirectUrl: details.url.replace(`${preferredThumbnailFile}.jpg`, 'hqdefault.jpg') + `&noRedirectToken=${noRedirectToken}`};
            }
        },
        {
            urls: [`https://i.ytimg.com/vi/*/${preferredThumbnailFile}.jpg*`],
            types: ['image']
        },
        ['blocking']
    );
}

function removeThumbnailRedirectListeners() {
    chrome.webRequest.onBeforeRequest.removeListener(redirectListener);
    chrome.webRequest.onHeadersReceived.removeListener(error404Listener);
}
