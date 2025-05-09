import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
	{
		label: 'DIY Homeowners',
		img: '/images/diy home owners.webp',
		alt: 'DIY home project in Botswana',
		heading: 'DIY Homeowners',
		text: 'Affordable tools for your next renovation.',
	},
	{
		label: 'Contractors',
		img: '/images/contractors.png',
		alt: 'Construction equipment in Botswana',
		heading: 'Contractors',
		text: 'Reliable gear for professionals, without the high costs.',
	},
	{
		label: 'Event Planners',
		img: '/images/event planners.webp',
		alt: 'Event setup in Botswana',
		heading: 'Event Planners',
		text: 'Everything you need for unforgettable events.',
	},
	{
		label: 'Small Businesses',
		img: '/images/small businesses.webp',
		alt: 'Small business equipment in Botswana',
		heading: 'Small Businesses',
		text: 'Flexible rentals to keep your business running.',
	},
	{
		label: 'Rural Farmers',
		img: '/images/rural farmers.png',
		alt: 'Farmer with tiller in Botswana',
		heading: 'Rural Farmers',
		text: 'Seasonal tools for your farm, made simple.',
	},
];

const listings = [
	{
		img: '/images/image1.webp',
		alt: 'Power Drill',
		title: 'Power Drill',
		price: 'BWP 50/day',
	},
	{
		img: '/images/event planners.webp',
		alt: 'Event Tent',
		title: 'Event Tent',
		price: 'BWP 200/day',
	},
	{
		img: '/images/rural farmers.png',
		alt: 'Tiller',
		title: 'Tiller',
		price: 'BWP 500/week',
	},
];

const testimonials = [
	{
		quote: '“Rented a tiller for my farm—saved me a fortune!”',
		author: 'Thabo, Farmer',
	},
	{
		quote: '“Easy to list my tools and earn extra income.”',
		author: 'Keitumetse, Contractor',
	},
];

const Home = () => {
	const [activeCategory, setActiveCategory] = useState(0);
	const [carouselIdx, setCarouselIdx] = useState(0);
	const [isPaused] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		setIsLoggedIn(!!localStorage.getItem('token'));
	}, []);

	useEffect(() => {
		if (isPaused) return;
		const timer = setInterval(() => {
			setCarouselIdx((idx) => (idx + 1) % listings.length);
		}, 5000);
		return () => clearInterval(timer);
	}, [isPaused]);

	return (
		<main
			style={{
				background: `url('/images/home items.png') center center/cover no-repeat`,
				minHeight: '100vh',
			}}
		>
			{/* Hero Section */}
			<section
				className="hero"
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: 420,
					background: 'rgba(69,90,100,0.85)',
					color: '#fff',
					borderRadius: 24,
					margin: '2em auto 2em auto',
					maxWidth: 1100,
					boxShadow: '0 4px 32px #455a6444',
				}}
			>
				<div style={{ flex: 1, padding: '2em' }}>
					<h1
						style={{
							fontSize: '2.7em',
							fontWeight: 800,
							marginBottom: 12,
							color: '#FF9800',
						}}
					>
						Rent or Lend Equipment in Botswana
					</h1>
					<p
						style={{
							fontSize: '1.3em',
							marginBottom: 24,
						}}
					>
						Affordable, secure, and community-driven equipment rentals for every
						need.
					</p>
					<div
						style={{
							display: 'flex',
							gap: 16,
							marginBottom: 16,
						}}
					>
						<button
							className="btn btn-primary"
							style={{
								background: '#FF9800',
								color: '#fff',
								fontWeight: 700,
								fontSize: '1.1em',
							}}
							onClick={() => navigate('/listings')}
						>
							Browse Equipment
						</button>
						<button
							className="btn btn-primary"
							style={{
								background: '#FF9800',
								color: '#fff',
								fontWeight: 700,
								fontSize: '1.1em',
							}}
							onClick={() => navigate('/login')}
						>
							List Your Equipment
						</button>
					</div>
					<p
						style={{
							color: '#fff',
							opacity: 0.85,
						}}
					>
						Join 5,000+ renters and owners across Botswana.
					</p>
				</div>
				<div
					style={{
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						padding: '2em',
					}}
				>
					<img
						src="/images/home items.png"
						alt="Home items"
						style={{
							width: 420,
							maxWidth: '100%',
							borderRadius: 20,
							boxShadow: '0 8px 32px #455a6444',
							border: '4px solid #fff',
						}}
					/>
				</div>
			</section>

			{/* Value Proposition */}
			<section
				className="value-prop"
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: 32,
					maxWidth: 1100,
					margin: '2em auto',
					background: '#fff',
					borderRadius: 20,
					boxShadow: '0 2px 16px #455a6422',
					padding: '2em 1em',
				}}
			>
				<div
					className="value-col"
					style={{
						flex: '1 1 180px',
						minWidth: 180,
						maxWidth: 220,
						textAlign: 'center',
					}}
				>
					<span
						style={{
							fontSize: '2.2em',
							color: '#FF9800',
						}}
					>
						💸
					</span>
					<h3
						style={{
							color: '#FF9800',
							fontWeight: 700,
						}}
					>
						Save Money
					</h3>
					<p
						style={{
							color: '#7B7F9E',
						}}
					>
						Rent instead of buying expensive equipment.
					</p>
				</div>
				<div
					className="value-col"
					style={{
						flex: '1 1 180px',
						minWidth: 180,
						maxWidth: 220,
						textAlign: 'center',
					}}
				>
					<span
						style={{
							fontSize: '2.2em',
							color: '#FF9800',
						}}
					>
						💰
					</span>
					<h3
						style={{
							color: '#FF9800',
							fontWeight: 700,
						}}
					>
						Earn Income
					</h3>
					<p
						style={{
							color: '#7B7F9E',
						}}
					>
						Monetize your underutilized tools.
					</p>
				</div>
				<div
					className="value-col"
					style={{
						flex: '1 1 180px',
						minWidth: 180,
						maxWidth: 220,
						textAlign: 'center',
					}}
				>
					<span
						style={{
							fontSize: '2.2em',
							color: '#FF9800',
						}}
					>
						🛠️
					</span>
					<h3
						style={{
							color: '#FF9800',
							fontWeight: 700,
						}}
					>
						Wide Selection
					</h3>
					<p
						style={{
							color: '#7B7F9E',
						}}
					>
						From DIY tools to farming gear, find what you need.
					</p>
				</div>
				<div
					className="value-col"
					style={{
						flex: '1 1 180px',
						minWidth: 180,
						maxWidth: 220,
						textAlign: 'center',
					}}
				>
					<span
						style={{
							fontSize: '2.2em',
							color: '#FF9800',
						}}
					>
						🔒
					</span>
					<h3
						style={{
							color: '#FF9800',
							fontWeight: 700,
						}}
					>
						Secure & Smart
					</h3>
					<p
						style={{
							color: '#7B7F9E',
						}}
					>
						AI-powered fraud detection and easy transactions via Orange Money.
					</p>
				</div>
			</section>

			{/* Category Tabs */}
			<section
				className="categories"
				style={{
					maxWidth: 1100,
					margin: '2em auto',
					background: '#fff',
					borderRadius: 20,
					boxShadow: '0 2px 16px #455a6422',
					padding: '2em 1em',
				}}
			>
				<h2
					style={{
						textAlign: 'center',
						color: '#455A64',
						fontSize: '2em',
						fontWeight: 700,
						marginBottom: 24,
					}}
				>
					Find Equipment for Every Need
				</h2>
				<div
					style={{
						display: 'flex',
						gap: 8,
						justifyContent: 'center',
						marginBottom: 32,
					}}
				>
					{categories.map((cat, idx) => (
						<button
							key={cat.label}
							className={activeCategory === idx ? 'tab active' : 'tab'}
							style={{
								background: activeCategory === idx ? '#455A64' : '#f7f7f7',
								color: activeCategory === idx ? '#FF9800' : '#455A64',
								border: 'none',
								borderRadius: '20px 20px 0 0',
								padding: '0.7em 1.5em',
								fontWeight: 600,
								fontSize: '1em',
								cursor: 'pointer',
								outline: 'none',
								transition: 'background 0.2s, color 0.2s',
							}}
							onClick={() => setActiveCategory(idx)}
						>
							{cat.label}
						</button>
					))}
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: 32,
						marginLeft: '0.2em',
					}}
				>
					<img
						src={categories[activeCategory].img}
						alt={categories[activeCategory].alt}
						style={{
							width: 340,
							height: 220,
							objectFit: 'cover',
							borderRadius: 12,
							boxShadow: '0 2px 12px #ffd60022',
							marginLeft: 0,
						}}
					/>
					<div>
						<h3
							style={{
								color: '#FF9800',
								fontSize: '1.2em',
								fontWeight: 700,
							}}
						>
							{categories[activeCategory].heading}
						</h3>
						<p
							style={{
								color: '#22223B',
								fontSize: '1em',
							}}
						>
							{categories[activeCategory].text}
						</p>
						<button
							className="btn btn-primary"
							style={{
								marginTop: 16,
								background: '#FF9800',
								color: '#fff',
								fontWeight: 700,
							}}
							onClick={() => navigate('/listings')}
						>
							Browse Now
						</button>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section
				className="how-it-works"
				style={{
					maxWidth: 1100,
					margin: '2em auto',
					background: '#F5F5F5',
					borderRadius: 20,
					boxShadow: '0 2px 16px #455a6422',
					padding: '2em 1em',
				}}
			>
				<h2
					style={{
						textAlign: 'center',
						color: '#FF9800',
						fontSize: '2em',
						fontWeight: 700,
						marginBottom: 24,
					}}
				>
					How It Works
				</h2>
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'center',
						gap: 32,
					}}
				>
					<div
						style={{
							flex: '1 1 200px',
							minWidth: 180,
							maxWidth: 240,
							background: '#fff',
							borderRadius: 12,
							padding: '1.5em 1em',
							textAlign: 'center',
							boxShadow: '0 2px 8px #ffd60022',
							margin: '0.5em 0',
						}}
					>
						<span
							style={{
								fontSize: '2em',
								color: '#FF9800',
							}}
						>
							🔍
						</span>
						<h4
							style={{
								color: '#455A64',
								fontSize: '1.1em',
								fontWeight: 700,
							}}
						>
							Search & Book
						</h4>
						<p
							style={{
								color: '#7B7F9E',
								fontSize: '1em',
							}}
						>
							Find equipment fast with AI-powered search.
						</p>
					</div>
					<div
						style={{
							flex: '1 1 200px',
							minWidth: 180,
							maxWidth: 240,
							background: '#fff',
							borderRadius: 12,
							padding: '1.5em 1em',
							textAlign: 'center',
							boxShadow: '0 2px 8px #ffd60022',
							margin: '0.5em 0',
						}}
					>
						<span
							style={{
								fontSize: '2em',
								color: '#FF9800',
							}}
						>
							💳
						</span>
						<h4
							style={{
								color: '#455A64',
								fontSize: '1.1em',
								fontWeight: 700,
							}}
						>
							Secure Payment
						</h4>
						<p
							style={{
								color: '#7B7F9E',
								fontSize: '1em',
							}}
						>
							Pay safely with Orange Money; funds held in escrow.
						</p>
					</div>
					<div
						style={{
							flex: '1 1 200px',
							minWidth: 180,
							maxWidth: 240,
							background: '#fff',
							borderRadius: 12,
							padding: '1.5em 1em',
							textAlign: 'center',
							boxShadow: '0 2px 8px #ffd60022',
							margin: '0.5em 0',
						}}
					>
						<span
							style={{
								fontSize: '2em',
								color: '#FF9800',
							}}
						>
							🤝
						</span>
						<h4
							style={{
								color: '#455A64',
								fontSize: '1.1em',
								fontWeight: 700,
							}}
						>
							Meet & Exchange
						</h4>
						<p
							style={{
								color: '#7B7F9E',
								fontSize: '1em',
							}}
						>
							Pick up or arrange delivery, confirm with ease.
						</p>
					</div>
				</div>
				<div
					style={{
						textAlign: 'center',
						marginTop: '1.5rem',
					}}
				>
					<a
						href="/how-it-works"
						className="btn btn-secondary"
						style={{
							background: '#FF9800',
							color: '#fff',
							fontWeight: 700,
							borderRadius: 30,
							padding: '0.9em 2em',
							textDecoration: 'none',
						}}
					>
						Learn More
					</a>
				</div>
			</section>

			{/* Trust Signals & Testimonials */}
			<section
				className="trust"
				style={{
					maxWidth: 900,
					margin: '2em auto',
					background: '#fff',
					borderRadius: 20,
					boxShadow: '0 2px 16px #455a6422',
					textAlign: 'center',
					padding: '2em 1em',
				}}
			>
				<div className="trust-content">
					<p
						style={{
							fontSize: '1.1em',
							color: '#455A64',
						}}
					>
						<strong>
							AI-driven fraud protection and secure escrow services.
						</strong>
					</p>
					<p
						style={{
							color: '#22223B',
						}}
					>
						Pay with trusted providers like
						<img
							src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Orange_logo.svg"
							alt="Orange Money"
							style={{
								height: '1.2em',
								verticalAlign: 'middle',
								margin: '0 0.2em',
								filter: 'grayscale(1) brightness(0.7)',
							}}
						/>
						Orange Money.
					</p>
					<div
						style={{
							margin: '1.5em auto 0 auto',
							fontStyle: 'italic',
							color: '#FF9800',
							fontSize: '1.1em',
						}}
					>
						{testimonials.map((t, idx) => (
							<div key={idx} style={{ marginBottom: 8 }}>
								{t.quote}
								<span
									style={{
										color: '#7B7F9E',
										fontSize: '0.95em',
										marginLeft: 8,
									}}
								>
									{t.author}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Featured Listings Carousel */}
			<section
				className="featured-listings"
				style={{
					maxWidth: 1100,
					margin: '2em auto',
					background: '#fff',
					borderRadius: 20,
					boxShadow: '0 2px 16px #455a6422',
					textAlign: 'center',
					padding: '2em 1em',
				}}
			>
				<h2
					style={{
						color: '#FF9800',
						fontSize: '2em',
						fontWeight: 700,
						marginBottom: 24,
					}}
				>
					Featured Listings
				</h2>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 16,
						position: 'relative',
					}}
				>
					<button
						className="carousel-btn prev"
						aria-label="Previous listing"
						style={{
							background: '#455A64',
							color: '#fff',
							border: 'none',
							borderRadius: '50%',
							width: 44,
							height: 44,
							fontSize: 22,
							cursor: 'pointer',
						}}
						onClick={() =>
							setCarouselIdx((idx) => (idx - 1 + listings.length) % listings.length)
						}
					>
						&lt;
					</button>
					<ul
						style={{
							display: 'flex',
							listStyle: 'none',
							padding: 0,
							margin: 0,
							overflow: 'hidden',
							width: 510,
							minHeight: 340,
							justifyContent: 'center',
						}}
					>
						{listings.map((item, idx) => (
							<li
								key={item.title}
								style={{
									display: carouselIdx === idx ? 'flex' : 'none',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									minWidth: 510,
									transition: 'opacity 0.2s',
									opacity: carouselIdx === idx ? 1 : 0,
								}}
								aria-hidden={carouselIdx !== idx}
							>
								<img
									src={item.img}
									alt={item.alt}
									style={{
										width: 510,
										height: 340,
										objectFit: 'cover',
										borderRadius: 20,
										boxShadow: '0 8px 32px #455a6444',
										border: '4px solid #fff',
										marginBottom: 12,
									}}
								/>
								<h4
									style={{
										color: '#455A64',
										fontSize: '1.1em',
										fontWeight: 700,
										marginBottom: 4,
									}}
								>
									{item.title}
								</h4>
								<p
									style={{
										color: '#FF9800',
										fontSize: '1em',
									}}
								>
									{item.price}
								</p>
							</li>
						))}
					</ul>
					<button
						className="carousel-btn next"
						aria-label="Next listing"
						style={{
							background: '#455A64',
							color: '#fff',
							border: 'none',
							borderRadius: '50%',
							width: 44,
							height: 44,
							fontSize: 22,
							cursor: 'pointer',
						}}
						onClick={() => setCarouselIdx((idx) => (idx + 1) % listings.length)}
					>
						&gt;
					</button>
				</div>
			</section>

			{/* Final Call-to-Action */}
			<section
				className="final-cta"
				style={{
					maxWidth: 900,
					margin: '2em auto',
					padding: '2em 1em',
					background: '#455A64',
					borderRadius: 20,
					color: '#fff',
					textAlign: 'center',
					boxShadow: '0 2px 16px #455a6422',
				}}
			>
				<h2
					style={{
						fontSize: '2em',
						fontWeight: 800,
						marginBottom: '1em',
						color: '#fff',
					}}
				>
					Ready to get started? Join Nkadime today!
				</h2>
				<div
					style={{
						marginBottom: '1em',
						display: 'flex',
						justifyContent: 'center',
						gap: 16,
					}}
				>
					<button
						className="btn btn-primary"
						style={{
							background: '#FF9800',
							color: '#fff',
							fontWeight: 700,
							fontSize: '1.1em',
						}}
						onClick={() => navigate('/register')}
					>
						Sign Up Now
					</button>
					{isLoggedIn && (
						<button
							className="btn btn-primary"
							style={{
								background: '#FF9800',
								color: '#fff',
								fontWeight: 700,
								fontSize: '1.1em',
							}}
							onClick={() => navigate('/create-listing')}
						>
							Start Listing
						</button>
					)}
				</div>
				<p
					className="incentive"
					style={{
						color: '#fff',
						fontSize: '1.1em',
						fontWeight: 700,
					}}
				>
					First rental 10% off!
				</p>
			</section>
		</main>
	);
};

export default Home;
