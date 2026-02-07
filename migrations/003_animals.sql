-- Animal companion system
-- Animals, evolution stages, user collection

-- ===================
-- ANIMALS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS animals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    unlock_price_cents INTEGER,
    conservation_status VARCHAR(50) NOT NULL,
    fun_fact TEXT NOT NULL
);

-- ===================
-- ANIMAL_STAGES TABLE
-- ===================
CREATE TABLE IF NOT EXISTS animal_stages (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 5),
    stage_name VARCHAR(50) NOT NULL,
    points_required INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    UNIQUE (animal_id, stage_number)
);

CREATE INDEX IF NOT EXISTS idx_animal_stages_animal ON animal_stages (animal_id, stage_number);

-- ===================
-- USER_ANIMALS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS user_animals (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    current_stage INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, animal_id)
);

-- ===================
-- ALTER USERS TABLE
-- ===================
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_animal_id INTEGER REFERENCES animals(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS animal_points INTEGER DEFAULT 0;

-- ===================
-- SEED ANIMALS (6 free, 10 premium)
-- ===================
INSERT INTO animals (id, name, species, emoji, color, description, is_premium, unlock_price_cents, conservation_status, fun_fact) VALUES
    (1,  'Giant Panda',      'Ailuropoda melanoleuca',   '🐼', '#1B1B1B', 'A gentle bamboo-loving bear from the mountains of China.',               FALSE, NULL, 'Vulnerable',            'Giant pandas spend 10-16 hours a day eating bamboo and can consume up to 38 kg daily.'),
    (2,  'Sloth',            'Bradypus variegatus',      '🦥', '#8B6914', 'The chillest animal in the rainforest canopy.',                          FALSE, NULL, 'Least Concern',         'Sloths are so slow that algae grows on their fur, giving them a greenish tint for camouflage.'),
    (3,  'Emperor Penguin',  'Aptenodytes forsteri',     '🐧', '#2D6A4F', 'The tallest penguin, braving the coldest Antarctic winters.',             FALSE, NULL, 'Near Threatened',       'Emperor penguins can dive over 500 meters deep and hold their breath for more than 20 minutes.'),
    (4,  'Sea Turtle',       'Chelonia mydas',           '🐢', '#40916C', 'An ancient ocean voyager that returns to the same beach to nest.',        FALSE, NULL, 'Endangered',            'Sea turtles use the Earth''s magnetic field to navigate thousands of miles across the ocean.'),
    (5,  'Koala',            'Phascolarctos cinereus',   '🐨', '#74C69D', 'A cuddly eucalyptus connoisseur from down under.',                       FALSE, NULL, 'Vulnerable',            'Koalas sleep up to 22 hours a day and have fingerprints nearly identical to humans.'),
    (6,  'Arctic Wolf',      'Canis lupus arctos',       '🐺', '#B7C9E2', 'A majestic white wolf adapted to the frozen tundra.',                    FALSE, NULL, 'Least Concern',         'Arctic wolves can survive in temperatures as low as -53°C and go weeks without food.'),
    (7,  'Snow Leopard',     'Panthera uncia',           '🐆', '#9B5DE5', 'The elusive ghost of the mountains, rarely seen by humans.',              TRUE,  299,  'Vulnerable',            'Snow leopards can leap up to 15 meters in a single bound and use their thick tails for balance.'),
    (8,  'Narwhal',          'Monodon monoceros',        '🦄', '#5B8DEF', 'The unicorn of the sea with a spectacular spiral tusk.',                  TRUE,  299,  'Near Threatened',       'A narwhal''s tusk is actually a long spiral tooth that can grow up to 3 meters and sense water temperature.'),
    (9,  'Tiger',            'Panthera tigris',          '🐅', '#E76F51', 'The largest wild cat, powerful and fiercely independent.',                TRUE,  499,  'Endangered',            'Every tiger has a unique pattern of stripes, like human fingerprints, and they love swimming.'),
    (10, 'Lion',             'Panthera leo',             '🦁', '#FFB703', 'The king of the savanna with an unmistakable mane.',                     TRUE,  499,  'Vulnerable',            'A lion''s roar can be heard from 8 km away, and they spend about 20 hours a day resting.'),
    (11, 'Rhinoceros',       'Diceros bicornis',         '🦏', '#6B7280', 'A gentle giant with armor-like skin and a powerful horn.',                TRUE,  499,  'Critically Endangered', 'Despite their size, rhinos can run up to 55 km/h and have existed for over 50 million years.'),
    (12, 'Bald Eagle',       'Haliaeetus leucocephalus', '🦅', '#8B4513', 'America''s iconic raptor with a wingspan of over 2 meters.',             TRUE,  299,  'Least Concern',         'Bald eagles can see fish in the water from over a mile away and dive at speeds of 160 km/h.'),
    (13, 'Sea Lion',         'Zalophus californianus',   '🦭', '#52B788', 'A playful and intelligent marine acrobat.',                              TRUE,  299,  'Least Concern',         'Sea lions can rotate their hind flippers forward and walk on all fours, unlike true seals.'),
    (14, 'Elephant',         'Loxodonta africana',       '🐘', '#4A5568', 'The world''s largest land animal with extraordinary memory.',             TRUE,  699,  'Endangered',            'Elephants can recognize themselves in mirrors and mourn their dead, visiting old bones for years.'),
    (15, 'Red Fox',          'Vulpes vulpes',            '🦊', '#D35400', 'A clever and adaptable trickster found on every continent except Antarctica.', TRUE, 299, 'Least Concern',    'Red foxes use the Earth''s magnetic field to hunt, pouncing in a northeast direction for best accuracy.'),
    (16, 'Monarch Butterfly','Danaus plexippus',         '🦋', '#FF6B9D', 'A tiny marvel that migrates thousands of miles each year.',              TRUE,  199,  'Endangered',            'Monarch butterflies travel up to 4,800 km during migration and can taste with their feet.')
ON CONFLICT DO NOTHING;

-- ===================
-- SEED STAGES (5 stages per animal)
-- ===================
DO $$
DECLARE
    a_id INTEGER;
    stage_names TEXT[] := ARRAY['Baby', 'Young', 'Adult', 'Elder', 'Ancient'];
    stage_points INTEGER[] := ARRAY[0, 100, 500, 1500, 5000];
BEGIN
    FOR a_id IN SELECT id FROM animals LOOP
        FOR i IN 1..5 LOOP
            INSERT INTO animal_stages (animal_id, stage_number, stage_name, points_required)
            VALUES (a_id, i, stage_names[i], stage_points[i])
            ON CONFLICT (animal_id, stage_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
