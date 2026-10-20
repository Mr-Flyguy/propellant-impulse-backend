CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT 'secret123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS propellants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    short_description VARCHAR(255),
    engineering_analysis TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    molar_mass DECIMAL(8, 3) NOT NULL,
    specific_heat_ratio DECIMAL(8, 3) DEFAULT 1.25,
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
(1, 'engineer_maksim', 'maksim@bmstu.ru'),
(2, 'chief_designer', 'designer@roscosmos.ru'),
(3, 'flight_specialist', 'specialist@roscosmos.ru'),
(4, 'test_pilot', 'pilot@gagarin.ru')
ON CONFLICT (id) DO NOTHING;

INSERT INTO propellants (id, name, short_description, engineering_analysis, status, image_url, video_url, molar_mass, specific_heat_ratio, creator_id, created_at, updated_at) VALUES
(1, 'Жидкий водород H₂', 'Эффективное рабочее тело за счёт минимальной массы и предельного импульса.', 'Идеальное рабочее тело с предельной скоростью истечения. При температуре реактора 2800 K диссоциация H₂ дополнительно увеличивает тягу без утяжеления активной зоны.', 'published', 'http://localhost:9000/propellants/propellant_h2.jpg', 'http://localhost:9000/propellants/video_exhaust_h2.mp4', 2.016, 1.41, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(2, 'Метан CH₄', 'Высокая плотность хранения и умеренная температура диссоциации. Отличный компромисс между объемом криогенных баков и импульсом.', 'Плотность жидкого метана в 6 раз выше водорода (422 кг/м³), что кардинально уменьшает сухую массу баков. При 2600 K диссоциирует на углерод и H₂, обеспечивая оптимальный баланс тяги и габаритов корабля.', 'draft', 'http://localhost:9000/propellants/propellant_ch4.jpg', 'http://localhost:9000/propellants/video_exhaust_ch4.mp4', 16.040, 1.32, 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(3, 'Аммиак NH₃', 'Удобен для длительного хранения без криоохлаждения и диссоциирует в реакторе.', 'Хранится в жидком виде при умеренном давлении. Полная каталитическая диссоциация 2NH₃ → N₂ + 3H₂ снижает эффективную массу смеси до 8.5 г/моль при отсутствии криогенных утечек в межпланетном перелете.', 'published', 'http://localhost:9000/propellants/propellant_nh3.jpg', 'http://localhost:9000/propellants/video_exhaust_nh3.mp4', 17.030, 1.31, 2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(4, 'Гидразин N₂H₄', 'Высокоплотное рабочее тело, дающее высокий расход при распаде в реакторе.', 'Двухстадийный распад в ТВЭЛах: первичный термолиз до азота и водорода с последующим нагревом в активной зоне до 2400 K. За счёт плотности 1.02 г/см³ минимизирует лобовое аэродинамическое сопротивление и объем баков.', 'published', 'http://localhost:9000/propellants/propellant_n2h4.jpg', 'http://localhost:9000/propellants/video_exhaust_n2h4.mp4', 32.050, 1.25, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(5, 'Диборан B₂H₆', 'Диборан обеспечивает хороший баланс между плотностью жидкой фазы и эффективностью реакторного нагрева. Требует карбидного покрытия ТВЭЛов.', 'Высокая теплотворность и компактность криобаков. Распад на мелкодисперсный бор и водород требует профилированного сопла Лаваля для предотвращения эрозии стенок и двухфазных потерь импульса.', 'published', 'http://localhost:9000/propellants/propellant_b2h6.jpg', 'http://localhost:9000/propellants/video_exhaust_b2h6.mp4', 27.670, 1.18, 1, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days'),
(6, 'Фторид хлора ClF₃', 'Высокоагрессивный окислитель с тяжелой струей истечения. Исключен из летной программы.', 'Высокая плотность и коррозионная активность. Ввиду тяжелых молекулярных продуктов распада и эрозии соплового аппарата снят с лётных испытаний.', 'deleted', '', '', 54.450, 1.22, 3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
(7, 'Водяной пар H₂O', 'Безопасное рабочее тело с высокой доступностью ресурсов для дозаправки.', 'Оптимально для миссий с космической дозаправкой на ледяных астероидах (ISRU). Плотность 1000 кг/м³ упрощает работу турбонасосного агрегата и снижает требования к радиационной защите корабля.', 'published', 'http://localhost:9000/propellants/propellant_h2o.jpg', 'http://localhost:9000/propellants/video_exhaust_h2o.mp4', 18.010, 1.33, 3, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days')
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
