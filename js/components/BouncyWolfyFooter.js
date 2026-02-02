export class BouncyWolfyFooter{
    constructor(){
        this.wolfy = document.getElementById("round-boi");
        this.animating = false;
        this.bounce = 0;
        this._init();
    }
    _init(){
        let toggle = false;

        this.wolfy?.addEventListener("click", () => {
            toggle = !toggle;
            this.wolfy.src = toggle ? "assets/the-round-blush.png" : "assets/the-round.png";
            this.bounce += 2;
            if (!this.animating) this._animate();
        });
    }

    _animate() {
        this.animating = true;
        let t = 0;
        const frame = () => {
            t += .1;
            const scaleX = 1 + Math.sin(t * 10) * (this.bounce * 0.05);
            const scaleY = 1 + Math.sin(t * 5) * (this.bounce * 0.05);
            this.wolfy.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
            this.bounce *= 0.95;
            if (this.bounce > 0.1) requestAnimationFrame(frame);
            else {
                this.wolfy.style.transform = "scale(1)";
                this.bounce = 0;
                this.animating = false;
            }
        }
        frame();
    }
}