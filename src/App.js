import React, {useState, useEffect} from 'react';
import './App.scss';

function App() {
    const [comicId, setComicId] = useState('1');
    const [comic, setComic] = useState('');

    useEffect(() => {
        fetch('https://xkcd.now.sh/?comic=' + comicId)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch.');
                }
                return response.json();
            })
            .then(data => setComic(data))
            .catch(err => console.error(err))
    }, [comicId]);

    function handleSubmit(e) {
        e.preventDefault();
    }

    return (
        <div className="App">
            <form className="search" onSubmit={handleSubmit}>
                <label className="search__label" htmlFor="search">#</label>
                <input id="search" className="search__field" type="number" value={comicId}
                       onChange={e => setComicId(e.target.value)}/>
                <button className="search__button">
                    <img src="./static/search.svg" alt="Zoeken"/>
                </button>
            </form>
            {comic
                ? (
                    <div className="comic">
                        <h1 className="comic__title">{comic.title}</h1>
                        <img className="comic__image" src={comic.img} alt=""/>
                        <p className="comic__description">
                            {comic.alt}
                            <div className="comic__year">{comic.year}</div>
                        </p>
                    </div>
                ) : ''
            }
        </div>
    );
}

export default App;