-- Seed Product Categories
INSERT INTO public.product_categories (id, name, slug, display_order)
VALUES
  ('c0deb21d-f00d-400d-800d-f00df00df00d', 'Food', 'food', 1),
  ('c0deb21d-7075-400d-800d-707570757075', 'Toys', 'toys', 2),
  ('c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Accessories', 'accessories', 3),
  ('c0deb21d-9700-400d-800d-970097009700', 'Grooming & Health', 'grooming', 4)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, slug = EXCLUDED.slug, display_order = EXCLUDED.display_order;

-- Seed Products
INSERT INTO public.products (id, category_id, name, description, price, stock, image_url, species, featured, active)
VALUES
  -- FOOD
  ('d06da0d1-f00d-400d-800d-000000000001', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Premium Dog Kibble', 'High-protein, grain-free dog food made with real chicken and fresh vegetables. Perfect for all dog sizes.', 29.99, 100, '/products/dog-food-premium.png', 'dog', true, true),
  ('d06da0d1-f00d-400d-800d-000000000002', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Organic Salmon Cat Food', 'Nutritious salmon and brown rice recipe, rich in Omega-3 fatty acids for a shiny coat and healthy joints.', 24.99, 85, '/products/cat-food-salmon.png', 'cat', true, true),
  ('d06da0d1-f00d-400d-800d-000000000003', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Gourmet Savory Dog Treats', 'All-natural jerky treats, smoke-flavored and rich in protein. A perfect reward for training sessions.', 12.99, 200, '/products/dog-treats.jpg', 'dog', false, true),
  ('d06da0d1-f00d-400d-800d-000000000004', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Tasty Chicken Wet Cat Food', 'Delicious real chicken shredded in rich gravy. Hydrating and packed with essential taurine.', 18.99, 120, '/products/cat-food.jpg', 'cat', false, true),
  ('d06da0d1-f00d-400d-800d-000000000005', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Nutrient-Rich Bird Seed Mix', 'A premium blend of seeds, grains, and dried fruits carefully formulated for parakeets, canaries, and finches.', 9.99, 60, '/products/bird-food-seeds.png', 'bird', true, true),
  ('d06da0d1-f00d-400d-800d-000000000006', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Fortified Rabbit Pellets', 'Timothy-hay based pellets fortified with essential vitamins and minerals for optimal rabbit digestion.', 14.99, 75, '/products/rabbit-pellets.jpg', 'rabbit', true, true),
  ('d06da0d1-f00d-400d-800d-000000000007', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Alfalfa & Timothy Hay Blend', 'Sun-cured premium sweet grass hay. High fiber content supporting healthy digestion and dental health.', 11.99, 90, '/products/timothy-hay.jpg', 'rabbit', false, true),
  ('d06da0d1-f00d-400d-800d-000000000008', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Tropical Fish Flake Food', 'Highly digestible, color-enhancing flakes designed to support the immune health of tropical freshwater fish.', 6.99, 150, '/products/fish-flakes.jpg', 'fish', true, true),
  ('d06da0d1-f00d-400d-800d-000000000009', 'c0deb21d-f00d-400d-800d-f00df00df00d', 'Reptile Calcium Pellets', 'Easy-to-digest pellets packed with calcium and vitamin D3 for healthy bone and shell development.', 15.99, 45, '/products/reptile-pellets.jpg', 'reptile', false, true),

  -- TOYS
  ('d06da0d1-7075-400d-800d-000000000001', 'c0deb21d-7075-400d-800d-707570757075', 'Interactive Dog Chew Toy', 'Extremely durable rubber chew toy. Can be stuffed with treats or peanut butter to keep dogs engaged for hours.', 14.99, 110, '/products/dog-toy.jpg', 'dog', true, true),
  ('d06da0d1-7075-400d-800d-000000000002', 'c0deb21d-7075-400d-800d-707570757075', 'Durable Rope Chew Toys Pack', 'Set of three colorful, braided cotton ropes. Promotes dental health through natural chewing and play.', 19.99, 80, '/products/chew-toys.jpg', 'dog', false, true),
  ('d06da0d1-7075-400d-800d-000000000003', 'c0deb21d-7075-400d-800d-707570757075', 'Classic Sisal Cat Scratching Post', 'Premium vertical scratching post wrapped in tough natural sisal rope, featuring a dangling toy mouse.', 34.99, 35, '/products/scratch-post.jpg', 'cat', true, true),
  ('d06da0d1-7075-400d-800d-000000000004', 'c0deb21d-7075-400d-800d-707570757075', 'Silent Running Hamster Wheel', 'Dual ball-bearing silent spinner wheel. Ensures your small pet gets exercise without making noise.', 15.99, 50, '/products/hamster-wheel.jpg', 'hamster', true, true),
  ('d06da0d1-7075-400d-800d-000000000005', 'c0deb21d-7075-400d-800d-707570757075', 'Natural Wood Bird Perch', 'Sanded branch-style bird perch made of natural wood. Easily mounts to any wired birdcage.', 8.99, 90, '/products/bird-perch.jpg', 'bird', false, true),

  -- ACCESSORIES
  ('d06da0d1-aacc-400d-800d-000000000001', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Orthopedic Memory Foam Pet Bed', 'Ultra-comfortable orthopedic bed supporting pressure points and joints. Removable, machine-washable cover.', 49.99, 25, '/products/luxury-pet-bed.png', 'all', true, true),
  ('d06da0d1-aacc-400d-800d-000000000002', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Plush Donut Calm Pet Bed', 'Cozy self-warming shag bed. Circular design encourages nesting and provides head and neck support.', 39.99, 30, '/products/pet-bed.jpg', 'all', false, true),
  ('d06da0d1-aacc-400d-800d-000000000003', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Adjustable Leather Dog Collar', 'Handcrafted from genuine leather. Highly durable collar with solid brass metal hardware and a D-ring.', 16.99, 70, '/products/dog-collar.jpg', 'dog', false, true),
  ('d06da0d1-aacc-400d-800d-000000000004', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Hanging Mirror Bird Bath', 'Sturdy acrylic bird bath tub equipped with a small reflection mirror, keeping your pet birds entertained.', 13.99, 40, '/products/bird-bath.jpg', 'bird', false, true),
  ('d06da0d1-aacc-400d-800d-000000000005', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Artificial Silk Aquarium Plant', 'Beautiful artificial plant adding color to your fish tank. Safe for all freshwater and marine fish.', 7.99, 120, '/products/aquarium-plant.jpg', 'fish', false, true),
  ('d06da0d1-aacc-400d-800d-000000000006', 'c0deb21d-aacc-400d-800d-aaccaaccaacc', 'Reptile Basking Spot Lamp', 'Provides essential UVA rays for metabolic health, heat regulation, and activity stimulation in reptiles.', 21.99, 35, '/products/reptile-lamp.jpg', 'reptile', true, true),

  -- GROOMING & HEALTH
  ('d06da0d1-9700-400d-800d-000000000001', 'c0deb21d-9700-400d-800d-970097009700', 'Soothing Aloe Vera Pet Shampoo', 'Gentle formula with aloe and oatmeal. Soothes itchy, dry skin while washing away dirt and odors.', 11.99, 80, '/products/shampoo.png', 'all', true, true),
  ('d06da0d1-9700-400d-800d-000000000002', 'c0deb21d-9700-400d-800d-970097009700', 'Gentle Puppy & Kitten Shampoo', 'Tear-free hypoallergenic shampoo formulated for young pets. Mild scent, rinses off very easily.', 10.99, 65, '/products/shampoo.jpg', 'all', false, true),
  ('d06da0d1-9700-400d-800d-000000000003', 'c0deb21d-9700-400d-800d-970097009700', 'Odor-Control Small Pet Bedding', 'Highly absorbent paper bedding for hamsters and guinea pigs. Inhibits odors for up to 10 days.', 12.99, 140, '/products/small-pet-bedding.jpg', 'hamster', false, true),
  ('d06da0d1-9700-400d-800d-000000000004', 'c0deb21d-9700-400d-800d-970097009700', 'Natural Cuttlebone for Birds', 'Pack of 2 natural cuttlebones. Provides critical calcium and helps keep bird beaks trimmed and healthy.', 4.99, 150, '/products/cuttlebone.jpg', 'bird', false, true),
  ('d06da0d1-9700-400d-800d-000000000005', 'c0deb21d-9700-400d-800d-970097009700', 'Concentrated Water Conditioner', 'Removes harmful chlorine, chloramines, and heavy metals instantly from tap water to make it fish-safe.', 8.99, 95, '/products/water-conditioner.jpg', 'fish', false, true)
ON CONFLICT (id) DO UPDATE
SET category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    species = EXCLUDED.species,
    featured = EXCLUDED.featured,
    active = EXCLUDED.active;
