export class ImageGallery{
    constructor(){
        this.area = document.getElementById("gallery-main-area");
        this.areaLatest = document.getElementById('latest-artwork-home');
        this.filterInput = document.getElementById('input-gallery-filter');

        this.sortNewestBtn = document.getElementById('newest');
        this.sortOldestBtn = document.getElementById('oldest');
        this.sortRandomBtn = document.getElementById('random');
        this.sortButtons = [this.sortNewestBtn, this.sortOldestBtn, this.sortRandomBtn];

        this.allImageData = [];
        this.filteredImageData = [];

        this.currentIndex = 0;
        this.batchSize = 6;
        this.isLoading = false;

        this._init(); 
    }

    async _init(){
        if (this.area) {
            const data = await fetch('data/gallery-data.json').then(res => res.json());
            this.allImageData = data;
            this.filteredImageData = data;

            this._resetAndRender();
            window.addEventListener('scroll', () => this._handleScroll());
            this.filterInput.addEventListener('input', (e) => this._handleFilter(e.target.value));

            this.sortNewestBtn.addEventListener('click', () => this._handleSort('newest'));
            this.sortOldestBtn.addEventListener('click', () => this._handleSort('oldest'));
            this.sortRandomBtn.addEventListener('click', () => this._handleSort('random'));
        }
        this._renderLatest();
        this._showLatestVideo();
        this._renderViaQueryString();
    }
    async _renderViaQueryString(){
        const params = new URLSearchParams(window.location.search);
        const title = params.get("title");
        fetch('data/gallery-data.json').then(res => res.json()).then(data => {
            const specific = data.filter(drawing => drawing.title.toLowerCase() == title.toLowerCase())[0];
            const specificImgElement = document.querySelector(`img[title='${specific.title}']`);
            this._open(specificImgElement);
        });
    }
    async _showLatestVideo(){
        if(!document.querySelector('iframe')) return;
        const ytframe = document.querySelector('iframe');
        const ytlink = document.getElementById('link_youtube_latest');
        await fetch('data/latest-video-data.json').then(res => res.json()).then(data => {
            ytframe.src += data.url;
            ytlink.href += data.url;
        });
    }
    _handleScroll() {
        if (this.isLoading) return;
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            this._renderBatch();
        }
    }
    _handleSort(type) {
        this.sortButtons.forEach(btn => btn.classList.remove('btn-selected'));
        document.getElementById(type).classList.add('btn-selected');

        const searchTerm = this.filterInput.value.toLowerCase();
        let dataToSort = this.allImageData;
        if (searchTerm) {
            dataToSort = this.allImageData.filter(img => 
                img.title.toLowerCase().includes(searchTerm) || 
                img.desc.toLowerCase().includes(searchTerm)
            );
        }

        switch (type) {
            case 'newest':
                this.filteredImageData = dataToSort;
                break;
            case 'oldest':
                this.filteredImageData = [...dataToSort].reverse();
                break;
            case 'random':
                const shuffled = [...dataToSort];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                this.filteredImageData = shuffled;
                break;
        }
        this._resetAndRender();
    }
    _handleFilter(searchTerm) {
        searchTerm = searchTerm.toLowerCase();

        if (!searchTerm) {
            this.filteredImageData = this.allImageData;
            this._resetAndRender();
        } else {
            this.filteredImageData = this.allImageData.filter(img => 
            img.title.toLowerCase().includes(searchTerm) || 
            img.desc.toLowerCase().includes(searchTerm)
        );

        this.area.innerHTML = '';

        if (this.filteredImageData.length === 0) {
            this.area.innerHTML = "No results :("
            return;
        }
        
        this.filteredImageData.forEach(img => this.area.appendChild(this._renderOne(img)));
        }
    }
    _open(img){
        const popupBlock = document.createElement('div');
        popupBlock.classList.add('popup-block');

        const imgPopup = document.createElement('div');
        imgPopup.classList.add('img-popup');

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('close-popup');
        closeBtn.textContent = 'X';
        
        closeBtn.addEventListener('click', () => this._close());
        popupBlock.addEventListener('click', () => this._close());
        
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this._close();
                removeEventListener('keydown', handleEsc);
            }
        };
        addEventListener('keydown', handleEsc);

        const heading = document.createElement('h3');
        heading.textContent = img.title;

        const line = document.createElement('img');
        line.src = 'assets/pen-line-1.png';
        line.alt = '';
        line.classList.add('w100', 'mobile-hide');

        const drawing = document.createElement('img');
        drawing.src = img.src;
        drawing.alt = '';

        const imageData = JSON.parse(img.getAttribute('data'));
        const description = document.createElement('p');
        description.innerText = imageData.desc !== "" ? imageData.desc : "no actual description available, sorry :(";

        const download = document.createElement('a');
        download.classList.add('btn-1', 'p4-8', 't1', 'radius-8');
        download.href = img.src;
        download.download = `${imageData.file}.png`;
        download.textContent = 'download';

        const areaButtons = document.createElement('span');
        areaButtons.classList.add('row', 'g8');

        imgPopup.appendChild(closeBtn);
        imgPopup.appendChild(heading);
        imgPopup.appendChild(line);
        imgPopup.appendChild(drawing);
        imgPopup.appendChild(description);
        areaButtons.appendChild(download);
        imgPopup.appendChild(areaButtons);

        popupBlock.classList.add('open-popup-block');
        imgPopup.classList.add('open-popup');
        document.body.append(popupBlock, imgPopup);
    }
    _close(){
        document.querySelectorAll('.img-popup').forEach(popup => {
            popup.classList.add('close-popup-block');
            popup.addEventListener('animationend', () => {
                popup.remove();
            })
        })
        document.querySelectorAll('.popup-block').forEach(block => {
            block.classList.add('close-popup-block');
            block.addEventListener('animationend', () => {
                block.remove();
            })
        })
    }
    _resetAndRender() {
        this.area.innerHTML = '';
        this.currentIndex = 0;
        this._renderBatch();
    }
    _renderBatch() {
        if (this.filterInput.value.length > 0 || this.currentIndex >= this.filteredImageData.length) {
            return;
        }

        this.isLoading = true;
        const fragment = document.createDocumentFragment();
        const nextIndex = Math.min(this.currentIndex + this.batchSize, this.filteredImageData.length);

        for (let i = this.currentIndex; i < nextIndex; i++) {
            fragment.appendChild(this._renderOne(this.filteredImageData[i]));
        }
        this.area.appendChild(fragment);
        this.currentIndex = nextIndex;
        this.isLoading = false;
    }
    async _renderLatest(){
        if(!this.areaLatest) return;
        const latest = await fetch('data/gallery-data.json').then(res => res.json()).then(data => data[0]);
        const rendered = this._renderOne(latest, true)
        this.areaLatest.append(rendered[0], rendered[1]);
    }
    _renderOne(img, isLatest = false){
        if(isLatest) {
            const figure = document.createElement("figure");
            figure.classList.add('column','g8');

            const drawing = document.createElement("img");
            drawing.src = `gallery/${img.file}`;
            drawing.title = img.title;
            drawing.classList.add('img-gallery', 'w100', 'radius-8');
            drawing.setAttribute("data", JSON.stringify(img));
            drawing.addEventListener('click', () => this._open(drawing));

            const caption = document.createElement('figcaption');
            caption.textContent = img.desc;

            figure.append(drawing, caption);

            const seemore = document.createElement('a');
            seemore.classList.add('btn-1', 'p4-8', 't1', 'radius-8');
            seemore.href = "gallery.html";
            seemore.innerText = "see more on the gallery";
            
            return [figure, seemore];
        }
        const div = document.createElement("div");
        div.classList.add('column', 'radius-8', 'b-shadow-8', 'p16', 'g16', 'w100', 'hfit');

        const title = document.createElement("h3");
        title.innerText = img.title;

        const line = document.createElement('img');
        line.src = "assets/pen-line-1.png";
        line.classList.add('w100', 'mobile-hide');

        const drawing = document.createElement('img');
        drawing.src = `gallery/${img.file}`;
        drawing.title = img.title;
        drawing.classList.add('img-gallery', 'w100', 'radius-8');
        drawing.setAttribute("data", JSON.stringify(img));
        drawing.addEventListener('click', () => this._open(drawing));

        div.append(title, line, drawing);
        return div;
    }
}

//====================================
// image reference ===================
//====================================
// <div class="column radius-8 b-shadow-8 p16 g16 w100 hfit">
//     <h3>my latest artwork</h3>
//     <img src="assets/pen-line-1.png" class="w100 mobile-hide" alt="">
//     <img src="" alt="[title]" class="img-gallery w100 radius-8">
// </div>
//====================================
// popup reference ===================
//====================================
// <div class="img-popup">
//     <button class="close-popup">X</button>
//     <h3>my latest artwork</h3>
//     <img src="assets/pen-line-1.png" class="w100 mobile-hide" alt="">
//     <img src="" alt="">
//     <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam nihil doloribus minima voluptas. Tenetur cum porro enim, corporis alias cupiditate?</p>
//     <a class="btn-1 p4-8 t1 radius-8" href="gallery.html" target="_blank">download</a>
// </div>