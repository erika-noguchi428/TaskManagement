CREATE TABLE tasks (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    priority    VARCHAR(10) NOT NULL,
    due_date    DATE,
    status      VARCHAR(20) NOT NULL DEFAULT '未着手',
    sort_order  INTEGER NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL
);
