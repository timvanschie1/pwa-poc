import React, {useState, useEffect} from 'react';
import './App.scss';

function App() {
    const MAX_COMIC_NR = 2228;

    const [comicId, setComicId] = useState('1');
    const [comic, setComic] = useState({});

    const [nrOfCachedComics, setNrOfCachedComics] = useState(null);
    const [cachedComics, setCachedComics] = useState([]);

    const [lastFetchSucceeded, setLastFetchSucceeded] = useState(true);

    useEffect(() => {
        if (!comicId || comicId === '0') {
            return;
        }

        fetchComic();
    }, [comicId]);

    function fetchComic() {
        const showLoaderAfterShortTime = window.setTimeout(() => setNrOfCachedComics(null), 100);
        fetch('https://xkcd.now.sh/?comic=' + comicId, {mode: 'cors'})
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch.');
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
                console.error(err);
                window.clearTimeout(showLoaderAfterShortTime);
                updateCacheInfo();
                setLastFetchSucceeded(false);
            })
    }

    function updateCacheInfo() {
        window.caches.open('pwa-poc-xkcd').then(cache => {
            cache.keys()
                .then(keys => {
                    const cachedComicsRequests = keys.filter(key => key.url.includes('xkcd.now.sh'));
                    // const cachedComicsResponses = cachedComicsRequests.map(request => {
                    //     cache.match(request).then(response => response.json());
                    // });

                    // Promise.all(cachedComicsResponses).then(() => {
                    //         console.dir(cachedComicsResponses);
                    //         setCachedComics(cachedComicsResponses);
                    //         setNrOfCachedComics(cachedComicsResponses.length);
                    //     }
                    // );

                    setNrOfCachedComics(cachedComicsRequests.length);
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
            console.log('cache', i);
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

    function handleSubmit(e) {
        e.preventDefault();
    }

    return (
        <div className="App">
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

            <form className="search" onSubmit={handleSubmit}>
                <label className="search__label" htmlFor="search">#</label>
                <input id="search"
                       className="search__field"
                       type="number"
                       value={comicId}
                       min="0"
                       max={MAX_COMIC_NR}
                       autoFocus
                       pattern="\d*"
                       onChange={e => setComicId(e.target.value)}/>
                <button disabled className="search__button">
                    <img src="./assets/search.svg" alt="Zoeken"/>
                </button>
            </form>
            {comic
                ? lastFetchSucceeded
                    ? (
                        <div className="comic">
                            <h1 className="comic__title">{comic.title}</h1>
                            <img className="comic__image" src={comic.img} alt=""/>
                            <p className="comic__description">
                                {comic.alt}
                                <span className="comic__year">{comic.year}</span>
                            </p>
                        </div>
                    ) : (
                        <div className="offline">
                            <h1 className="offline__title">Je bent offline</h1>
                            <p>Deze eerder opgeslagen comics kun je wel bekijken:</p>
                            <ul className="offline__cached">
                                {/*{cachedComics.map(cachedComic =>*/}
                                {/*    <li>*/}
                                {/*        <a href="#" onClick={e => {*/}
                                {/*            e.preventDefault();*/}
                                {/*            setComicId(cachedComic.num);*/}
                                {/*        }}>*/}
                                {/*            <img src={cachedComic.img} alt=""/>*/}
                                {/*            <span className="offline__cached-nr">{cachedComic.num}</span>*/}
                                {/*        </a>*/}
                                {/*    </li>*/}
                                {/*)}*/}
                            </ul>
                        </div>
                    )
                : ''
            }
        </div>
    );
}

export default App;