import React, {useState, useEffect} from 'react';
import './App.scss';
import 'whatwg-fetch';
import 'promise-polyfill/src/polyfill';

function App() {
    const MAX_COMIC_NR = 2228;
    const cacheIsSupported = 'caches' in self;
    const swIsSupported = 'serviceWorker' in navigator;

    const [comicId, setComicId] = useState('1');
    const [comic, setComic] = useState({});
    const [nrOfCachedComics, setNrOfCachedComics] = useState(null);
    const [cachedComics, setCachedComics] = useState([]);
    const [lastFetchSucceeded, setLastFetchSucceeded] = useState(true);

    useEffect(() => {
        if (!comicId || comicId === '0') {
            return;
        }

        if (comicId > MAX_COMIC_NR) {
            setComicId(MAX_COMIC_NR);
        }

        fetchComic();
    }, [comicId]);

    function fetchComic() {
        const showLoaderAfterShortTime = window.setTimeout(() => setNrOfCachedComics(null), 100);

        fetch('https://xkcd.now.sh/?comic=' + comicId, {mode: 'cors'})
            .then(response => {
                if (!response.ok) {
                    throw new Error();
                }
                return response.json();
            })
            .then(data => setComic(data))
            .then(() => {
                window.clearTimeout(showLoaderAfterShortTime);
                updateCacheInfo();
                setLastFetchSucceeded(true);
            })
            .catch(err => {
                window.clearTimeout(showLoaderAfterShortTime);
                updateCacheInfo();
                setLastFetchSucceeded(false);
            })
    }

    function updateCacheInfo() {
        if (!cacheIsSupported) {
            return;
        }

        window.caches.open('pwa-poc-xkcd').then(cache => {
            cache.keys()
                .then(keys => {
                    const cachedComicsRequests = keys.filter(key => key.url.includes('xkcd.now.sh'));
                    const cachedComicsResponses = cachedComicsRequests.map(request => {
                        return cache.match(request)
                            .then(response => response.json())
                    });

                    Promise.all(cachedComicsResponses)
                        .then(responses => responses.sort((a, b) => a.num - b.num))
                        .then(sortedResponses => {
                                setCachedComics(sortedResponses);
                                setNrOfCachedComics(sortedResponses.length);
                            }
                        );
                });
        })
    }

    function emptyCache() {
        setNrOfCachedComics(null);
        window.caches.open('pwa-poc-xkcd')
            .then(cache => {
                cache.keys()
                    .then(keys => {
                        const cachedComicsArray = keys.filter(key => key.url.includes('xkcd.now.sh'));
                        cachedComicsArray.forEach(comicRequest => {
                            cache.delete(comicRequest);
                        });
                    })
                    .then(() => {
                        setCachedComics([]);
                        updateCacheInfo()
                    })
            })
    }

    function cacheBunchOfComics() {
        setNrOfCachedComics(null);
        for (let i = 1; i <= 100; i++) {
            fetch('https://xkcd.now.sh/?comic=' + i, {mode: 'cors'})
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch.');
                    }
                    return response.json();
                })
                .then(response =>
                    fetch(response.img)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch.');
                            }
                            return response.json();
                        })
                        .catch(err => console.error(err)))
                .then(i === 100 && updateCacheInfo)
                .catch(err => console.error(err))
        }
    }

    function handleIncrementSearch(e, increment) {
        e.preventDefault();
        const newComicId = parseInt(comicId) + increment;

        if (newComicId < 1 || newComicId > MAX_COMIC_NR) {
            return;
        }

        setComicId(newComicId);
    }

    const renderCacheInfo = (
        <div className="cache">
            {nrOfCachedComics === null
                ? (
                    <h2 className='loading'>
                        <span className="loading__dot loading__dot--1">.</span>
                        <span className="loading__dot loading__dot--2">.</span>
                        <span className="loading__dot loading__dot--3">.</span>
                    </h2>
                ) : <h2>{nrOfCachedComics}</h2>
            }
            <p className="cache__info">In cache</p>
            <button onClick={emptyCache}>Empty</button>
            <button onClick={cacheBunchOfComics}>Cache 100</button>
        </div>
    );

    const renderForm = (
        <form className="search" onSubmit={e => e.preventDefault()}>
            <a href="#" className="search__button" onClick={e => handleIncrementSearch(e, -1)}>-</a>
            <input id="search"
                   className="search__field"
                   type="number"
                   value={comicId}
                   min="0"
                   max={MAX_COMIC_NR}
                   autoFocus
                   pattern="\d*"
                   onChange={e => {
                       e.preventDefault();
                       setComicId(e.target.value);
                   }}/>
            <label className="search__label" htmlFor="search">#</label>
            <a href="#" className="search__button" onClick={e => handleIncrementSearch(e, 1)}>+</a>
        </form>
    );

    const renderComic = (
        <div className="comic">
            <h1 className="comic__title">{comic.title}</h1>
            <img className="comic__image" src={comic.img} alt=""/>
            <p className="comic__description">
                {comic.alt}
                <span className="comic__year">{comic.year}</span>
            </p>
        </div>
    );

    const renderOfflineFallback = (
        <div className="offline">
            <h1 className="offline__title">Je bent offline</h1>
            {cacheIsSupported && cachedComics.length > 0
                ? (
                    <React.Fragment>
                        <p>Deze eerder opgeslagen comics kun je wel bekijken:</p>
                        <ul className="offline__cached">
                            {cachedComics.map(cachedComic =>
                                <li key={cachedComic.num}>
                                    <a href="#" onClick={e => {
                                        e.preventDefault();
                                        setComicId(cachedComic.num);
                                    }}>
                                        <img src={cachedComic.img} alt=""/>
                                        <span className="offline__cached-nr">{cachedComic.num}</span>
                                    </a>
                                </li>
                            )}
                        </ul>
                    </React.Fragment>
                ) : ''
            }
        </div>
    );

    const renderApiSupport = (
        <div className="api-support">
            <h2>This browser supports</h2>
            <div>Service Worker: <span>{swIsSupported ? 'YES' : 'NO'}</span></div>
            <div>Cache API: <span>{cacheIsSupported ? 'YES' : 'NO'}</span></div>
        </div>
    );

    return (
        <React.Fragment>
            {renderApiSupport}
            {cacheIsSupported ? renderCacheInfo : ''}
            <div className="App">
                {renderForm}
                {comic
                    ? lastFetchSucceeded
                        ? renderComic
                        : renderOfflineFallback
                    : ''
                }
            </div>
        </React.Fragment>
    );
}

export default App;