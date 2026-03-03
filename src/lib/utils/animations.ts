import type { AnimationType } from '$lib/types';

const COLORS = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];

export function getRandomAnimation(): AnimationType {
	const types: AnimationType[] = ['confetti', 'explosion', 'snippets', 'fireworks', 'stars'];
	return types[Math.floor(Math.random() * types.length)];
}

export function runAnimation(canvas: HTMLCanvasElement, type: AnimationType) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	switch (type) {
		case 'confetti': confettiAnimation(ctx, canvas); break;
		case 'explosion': explosionAnimation(ctx, canvas); break;
		case 'snippets': snippetsAnimation(ctx, canvas); break;
		case 'fireworks': fireworksAnimation(ctx, canvas); break;
		case 'stars': starsAnimation(ctx, canvas); break;
	}
}

interface Particle {
	x: number; y: number; vx: number; vy: number;
	color: string; size: number; rotation: number; rotationSpeed: number;
	life: number; maxLife: number; gravity: number; opacity: number;
	shape?: 'rect' | 'circle' | 'star' | 'strip';
}

function createParticles(count: number, cx: number, cy: number, opts: Partial<Particle> = {}): Particle[] {
	return Array.from({ length: count }, () => ({
		x: cx,
		y: cy,
		vx: (Math.random() - 0.5) * 12,
		vy: (Math.random() - 0.5) * 12,
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		size: 4 + Math.random() * 8,
		rotation: Math.random() * Math.PI * 2,
		rotationSpeed: (Math.random() - 0.5) * 0.2,
		life: 0,
		maxLife: 60 + Math.random() * 40,
		gravity: 0.1,
		opacity: 1,
		...opts
	}));
}

function animateParticles(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	particles: Particle[],
	drawFn: (ctx: CanvasRenderingContext2D, p: Particle) => void
) {
	let frame: number;
	function tick() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let alive = false;
		for (const p of particles) {
			p.life++;
			if (p.life > p.maxLife) continue;
			alive = true;
			p.x += p.vx;
			p.y += p.vy;
			p.vy += p.gravity;
			p.rotation += p.rotationSpeed;
			p.opacity = 1 - p.life / p.maxLife;
			drawFn(ctx, p);
		}
		if (alive) {
			frame = requestAnimationFrame(tick);
		} else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
	}
	tick();
	setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3000);
}

function confettiAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const particles = Array.from({ length: 80 }, () => ({
		x: Math.random() * canvas.width,
		y: -20 - Math.random() * 100,
		vx: (Math.random() - 0.5) * 4,
		vy: 2 + Math.random() * 4,
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		size: 5 + Math.random() * 8,
		rotation: Math.random() * Math.PI * 2,
		rotationSpeed: (Math.random() - 0.5) * 0.15,
		life: 0,
		maxLife: 80 + Math.random() * 40,
		gravity: 0.02,
		opacity: 1,
		shape: (Math.random() > 0.5 ? 'rect' : 'strip') as 'rect' | 'strip'
	}));

	animateParticles(ctx, canvas, particles, (c, p) => {
		c.save();
		c.translate(p.x, p.y);
		c.rotate(p.rotation);
		c.globalAlpha = p.opacity;
		c.fillStyle = p.color;
		if (p.shape === 'strip') {
			c.fillRect(-p.size / 2, -1, p.size, 3);
		} else {
			c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
		}
		c.restore();
	});
}

function explosionAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const cx = canvas.width / 2;
	const cy = canvas.height / 2;
	const particles = createParticles(60, cx, cy, { gravity: 0.15 }).map((p) => ({
		...p,
		vx: (Math.random() - 0.5) * 20,
		vy: (Math.random() - 0.5) * 20,
		size: 3 + Math.random() * 6,
		shape: 'circle' as const
	}));

	animateParticles(ctx, canvas, particles, (c, p) => {
		c.save();
		c.globalAlpha = p.opacity;
		c.fillStyle = p.color;
		c.beginPath();
		c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
		c.fill();
		// Glow effect
		c.shadowBlur = 15;
		c.shadowColor = p.color;
		c.fill();
		c.restore();
	});
}

function snippetsAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const particles = Array.from({ length: 50 }, () => ({
		x: Math.random() * canvas.width,
		y: -10 - Math.random() * 200,
		vx: (Math.random() - 0.5) * 2,
		vy: 1 + Math.random() * 3,
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		size: 8 + Math.random() * 12,
		rotation: Math.random() * Math.PI * 2,
		rotationSpeed: (Math.random() - 0.5) * 0.1,
		life: 0,
		maxLife: 100 + Math.random() * 40,
		gravity: 0.01,
		opacity: 1,
		shape: 'rect' as const
	}));

	animateParticles(ctx, canvas, particles, (c, p) => {
		c.save();
		c.translate(p.x, p.y);
		c.rotate(p.rotation);
		c.globalAlpha = p.opacity * 0.85;
		c.fillStyle = p.color;
		// Paper snippet shape
		c.beginPath();
		c.moveTo(-p.size / 2, -p.size / 3);
		c.lineTo(p.size / 2, -p.size / 4);
		c.lineTo(p.size / 3, p.size / 3);
		c.lineTo(-p.size / 3, p.size / 4);
		c.closePath();
		c.fill();
		c.restore();
	});
}

function fireworksAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const bursts = [
		{ cx: canvas.width * 0.3, cy: canvas.height * 0.3, delay: 0 },
		{ cx: canvas.width * 0.7, cy: canvas.height * 0.4, delay: 15 },
		{ cx: canvas.width * 0.5, cy: canvas.height * 0.25, delay: 30 }
	];

	const allParticles: Particle[] = [];
	for (const burst of bursts) {
		const particles = createParticles(30, burst.cx, burst.cy, {
			gravity: 0.08,
			maxLife: 60 + Math.random() * 20
		}).map((p) => {
			const angle = Math.random() * Math.PI * 2;
			const speed = 3 + Math.random() * 6;
			return {
				...p,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: -burst.delay, // delayed start
				shape: 'circle' as const
			};
		});
		allParticles.push(...particles);
	}

	animateParticles(ctx, canvas, allParticles, (c, p) => {
		if (p.life < 0) return; // not yet started
		c.save();
		c.globalAlpha = p.opacity;
		// Draw trail
		c.strokeStyle = p.color;
		c.lineWidth = 2;
		c.beginPath();
		c.moveTo(p.x, p.y);
		c.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
		c.stroke();
		// Draw head
		c.fillStyle = p.color;
		c.shadowBlur = 10;
		c.shadowColor = p.color;
		c.beginPath();
		c.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
		c.fill();
		c.restore();
	});
}

function starsAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const cx = canvas.width / 2;
	const cy = canvas.height / 2;
	const particles = createParticles(40, cx, cy, { gravity: 0.05 }).map((p) => {
		const angle = Math.random() * Math.PI * 2;
		const speed = 2 + Math.random() * 5;
		return {
			...p,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			size: 6 + Math.random() * 10,
			shape: 'star' as const
		};
	});

	animateParticles(ctx, canvas, particles, (c, p) => {
		c.save();
		c.translate(p.x, p.y);
		c.rotate(p.rotation);
		c.globalAlpha = p.opacity;
		c.fillStyle = p.color;
		c.shadowBlur = 12;
		c.shadowColor = p.color;
		drawStar(c, 0, 0, 5, p.size, p.size / 2);
		c.restore();
	});
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
	let rot = (Math.PI / 2) * 3;
	const step = Math.PI / spikes;
	ctx.beginPath();
	ctx.moveTo(cx, cy - outerR);
	for (let i = 0; i < spikes; i++) {
		ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
		rot += step;
		ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
		rot += step;
	}
	ctx.lineTo(cx, cy - outerR);
	ctx.closePath();
	ctx.fill();
}
