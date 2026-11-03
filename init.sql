CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT 'secret123',
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS propellants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    molar_mass DECIMAL(8, 3) NOT NULL,
    specific_heat_ratio DECIMAL(8, 3) DEFAULT 1.25,
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_propellant_status CHECK (status IN ('draft', 'published', 'deleted'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_draft 
ON propellants (creator_id) 
WHERE status = 'draft';

CREATE TABLE IF NOT EXISTS propellant_likes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    propellant_id INT NOT NULL REFERENCES propellants(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_propellant UNIQUE (user_id, propellant_id)
);

INSERT INTO users (id, username, email) VALUES
(1, 'test_engineer', 'engineer@bmstu.ru'),
(2, 'chief_designer', 'designer@roscosmos.ru'),
(3, 'flight_specialist', 'specialist@roscosmos.ru'),
(4, 'test_pilot', 'pilot@gagarin.ru')
ON CONFLICT (id) DO NOTHING;

INSERT INTO propellants (id, name, description, status, image_url, video_url, molar_mass, specific_heat_ratio, creator_id, created_at, updated_at) VALUES
(1, 'Жидкий водород', 'Эффективное рабочее тело за счет минимальной массы и предельного импульса. При высокой температуре реактора диссоциация молекул дополнительно увеличивает тягу без утяжеления активной зоны двигательной установки.', 'published', 'http://localhost:9000/propellants/propellant_h2.jpg', 'http://localhost:9000/propellants/video_exhaust_h2.mp4', 2.016, 1.41, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(2, 'Метан', 'Высокая плотность хранения и умеренная температура диссоциации. Отличный компромисс между объемом криогенных баков и импульсом. Значительная плотность жидкой фазы кардинально уменьшает сухую массу баковых конструкций корабля.', 'draft', 'http://localhost:9000/propellants/propellant_ch4.jpg', 'http://localhost:9000/propellants/video_exhaust_ch4.mp4', 16.040, 1.32, 1, NOW() - INTERVAL '4 days', NULL),
(3, 'Аммиак', 'Удобен для длительного хранения без криоохлаждения и диссоциирует в реакторе. Хранится в жидком виде при умеренном давлении. Полная каталитическая диссоциация снижает эффективную массу смеси при отсутствии криогенных потерь в перелете.', 'published', 'http://localhost:9000/propellants/propellant_nh3.jpg', 'http://localhost:9000/propellants/video_exhaust_nh3.mp4', 17.030, 1.31, 2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(4, 'Гидразин', 'Высокоплотное рабочее тело, дающее высокий расход при распаде в реакторе. Двухстадийный распад в ТВЭЛах: первичный термолиз с последующим нагревом в активной зоне. За счет высокой плотности минимизирует сопротивление и объем баков.', 'published', 'http://localhost:9000/propellants/propellant_n2h4.jpg', 'http://localhost:9000/propellants/video_exhaust_n2h4.mp4', 32.050, 1.25, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(5, 'Диборан', 'Обеспечивает хороший баланс между плотностью жидкой фазы и эффективностью реакторного нагрева. Требует специального карбидного покрытия каналов нагрева. Высокая теплотворность и компактность баковых отсеков.', 'published', 'http://localhost:9000/propellants/propellant_b2h6.jpg', 'http://localhost:9000/propellants/video_exhaust_b2h6.mp4', 27.670, 1.18, 1, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days'),
(6, 'Фторид хлора', 'Высокоагрессивный окислитель с тяжелой струей истечения. Исключен из летной программы испытаний ввиду повышенной химической активности продуктов истечения и эрозии сопла.', 'deleted', '', '', 54.450, 1.22, 3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
(7, 'Водяной пар', 'Безопасное рабочее тело с высокой доступностью ресурсов для повторной заправки на космических телах. Оптимально для транспортных операций на околоземных и межпланетных траекториях.', 'published', 'http://localhost:9000/propellants/propellant_h2o.jpg', 'http://localhost:9000/propellants/video_exhaust_h2o.mp4', 18.010, 1.33, 3, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('propellants_id_seq', (SELECT MAX(id) FROM propellants));

INSERT INTO propellant_likes (user_id, propellant_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 1),
(2, 2), (3, 2),
(1, 3), (3, 3), (4, 3),
(1, 4),
(1, 7), (2, 7), (4, 7)
ON CONFLICT DO NOTHING;
