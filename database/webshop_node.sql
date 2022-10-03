CREATE TABLE users
(
    id       serial primary key,
    name     varchar(30),
    email    varchar(30) unique,
    password varchar(400),
    type     varchar(10),
    status   varchar(20)
);


CREATE TABLE blocked_users
(
    user_id      int,
    is_permanent bool,
    time_stamp   timestamp,
    primary key (user_id),
    foreign key (user_id) references users (id)
);


CREATE TABLE store_info
(
    store_id   int,
    phone      varchar(15),
    address    varchar(30),
    store_type varchar(15),
    pfp_url    varchar(150),
    cover_url  varchar(150),
    primary key (store_id),
    foreign key (store_id) references users (id)
);


CREATE TABLE store_outlets
(
    id       serial,
    store_id int,
    address  varchar(30),
    phone    varchar(15),
    primary key (id, store_id),
    foreign key (store_id) references users (id)
);


CREATE TABLE store_reviews
(
    id        serial,
    store_id  int,
    user_id   int,
    rating    float,
    comment   varchar(200),
    date_time timestamp,
    primary key (id, store_id, user_id),
    foreign key (store_id) references users (id),
    foreign key (user_id) references users (id)
);


CREATE TABLE products
(
    id          serial unique,
    store_id    int,
    name        varchar(50),
    description varchar(200),
    quantity    int,
    price       float,
    primary key (id, store_id),
    foreign key (store_id) references users (id)
);


CREATE TABLE keywords
(
    id         serial,
    product_id int,
    keyword    varchar(30),
    primary key (id, product_id),
    foreign key (product_id) references products (id)
);


CREATE TABLE categories
(
    id       serial primary key,
    category varchar(50)
);


CREATE TABLE products_categories
(
    product_id  int,
    category_id int,
    primary key (product_id, category_id),
    foreign key (product_id) references products (id),
    foreign key (category_id) references categories (id)
);


CREATE TABLE product_images
(
    id         serial,
    product_id int,
    img_name   varchar(20),
    img_url    varchar(100),
    img_number int,
    primary key (id, product_id),
    foreign key (product_id) references products (id)
);


CREATE TABLE product_reviews
(
    id         serial,
    store_id   int,
    product_id int,
    user_id    int,
    rating     float,
    comment    varchar(200),
    date_time  timestamp,
    primary key (id, store_id, product_id, user_id),
    foreign key (store_id) references users (id),
    foreign key (user_id) references users (id),
    foreign key (product_id) references products (id)
);


CREATE TABLE interests
(
    id       serial primary key,
    interest varchar(50)
);


CREATE TABLE users_interests
(
    user_id     int,
    interest_id int,
    primary key (user_id, interest_id),
    foreign key (user_id) references users (id),
    foreign key (interest_id) references interests (id)
);


CREATE TABLE orders
(
    id           serial unique,
    store_id     int,
    user_id      int,
    order_date   timestamp,
    order_status varchar(20),
    address      varchar(30),
    phone        varchar(20),
    city         varchar(30),
    zip          varchar(10),
    primary key (id, store_id, user_id),
    foreign key (store_id) references users (id),
    foreign key (user_id) references users (id)
);


CREATE TABLE order_items
(
    order_id   int,
    product_id int,
    quantity   int,
    price      float,
    primary key (order_id, product_id),
    foreign key (order_id) references orders (id),
    foreign key (product_id) references products (id)
);


CREATE TABLE messages
(
    id        serial,
    sender    int,
    receiver  int,
    message   varchar(200),
    timestamp timestamp,
    primary key (id, sender, receiver),
    foreign key (sender) references users (id),
    foreign key (receiver) references users (id)
);


CREATE TABLE store_notifications
(
    id           serial,
    store_id     int,
    notification varchar(200),
    timestamp    timestamp,
    primary key (id, store_id),
    foreign key (store_id) references users (id)
);


CREATE TABLE coupons
(
    id             serial primary key,
    coupon         varchar(20) unique,
    discount       int,
    number_of_uses int
);


CREATE TABLE product_follows
(
    id         serial,
    user_id    int,
    product_id int,
    primary key (id, user_id, product_id),
    foreign key (user_id) references users (id),
    foreign key (product_id) references products (id) on delete cascade
);


ALTER TABLE products_categories
    ADD CONSTRAINT category_id
        FOREIGN KEY (category_id)
            REFERENCES categories (id)
            ON DELETE CASCADE;

ALTER TABLE users_interests
    ADD CONSTRAINT interest_id
        FOREIGN KEY (interest_id)
            REFERENCES interests (id)
            ON DELETE CASCADE;


CREATE OR REPLACE FUNCTION didProductChangePrice(productID int, productPrice float) RETURNS BOOLEAN AS
$$
DECLARE
    current_price int;
BEGIN
    SELECT price FROM products WHERE id = productID INTO current_price;
    IF current_price != productPrice THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION getUserChats(userID int)
    RETURNS TABLE
            (
                contact_id int,
                name       varchar,
                status     varchar,
                type       varchar,
                pfp_img    varchar
            )
AS
$$
BEGIN
    RETURN QUERY SELECT DISTINCT u.id,
                                 u.name,
                                 u.status,
                                 u.type,
                                 (SELECT pfp_url FROM store_info WHERE store_id = u.id) pfp_img
                 FROM messages
                          INNER JOIN users u ON u.id = messages.receiver
                 WHERE (receiver = userID
                     OR sender = userID)
                   AND u.id != userID;
END;
$$
    language plpgsql;



CREATE OR REPLACE FUNCTION getMessages(user1_ID int, user2_ID int)
    RETURNS TABLE
            (
                sender       int,
                receiver     int,
                message      varchar,
                sending_time time,
                sending_date date
            )
AS
$$
BEGIN
    RETURN QUERY SELECT m.sender, m.receiver, m.message, m.timestamp::time AS time, m.timestamp::date AS date
                 FROM messages m
                          INNER JOIN users u ON u.id = m.receiver
                 WHERE (sender = user1_ID AND receiver = user2_ID)
                    OR (sender = user2_ID AND receiver = user1_ID)
                 ORDER BY m.timestamp;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION addNewProduct2(
    store_id_
        int,
    name_
        varchar(50), description_ varchar(250),
    quantity_ int, price_ int)
    RETURNS integer AS
$$
DECLARE
    u_id integer;
BEGIN
    INSERT INTO products (store_id, name, description, quantity, price)
    VALUES (store_id_, name_, description_, quantity_, price_)
    RETURNING id INTO u_id;

    return u_id;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION updateProduct(p_id int, p_name varchar(50), p_description varchar(250),
                                         p_quantity int, p_price int)
    RETURNS VOID AS
$$
BEGIN
    UPDATE products
    SET name        = p_name,
        description = p_description,
        price       = p_price,
        quantity    = p_quantity
    WHERE id = p_id;
    DELETE FROM products_categories WHERE product_id = p_id;
    DELETE FROM keywords WHERE product_id = p_id;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION updateUserInfo(user_id int, user_name varchar(50)) RETURNS VOID AS
$$
BEGIN
    UPDATE users SET name = user_name WHERE id = user_id;
    DELETE FROM users_interests WHERE users_interests.user_id = updateUserInfo.user_id;
END;
$$
    language plpgsql;



CREATE OR REPLACE FUNCTION recommendedProducts(userID integer)
    RETURNS TABLE
            (
                store_id    int,
                id          int,
                name        varchar(50),
                description varchar(200),
                quantity    int,
                price       float
            )
AS
$$
BEGIN
    RETURN QUERY SELECT p.store_id    AS store_id,
                        p.product_id  AS id,
                        p.name        AS name,
                        p.description AS description,
                        p.quantity    AS quantity,
                        p.price       AS price
                 FROM (SELECT *
                       FROM products
                                INNER JOIN products_categories pc ON products.id = pc.product_id
                                INNER JOIN categories c ON c.id = pc.category_id) AS p
                 WHERE p.category in (SELECT interest
                                      FROM interests
                                               INNER JOIN users_interests ui ON interests.id = ui.interest_id
                                      WHERE user_id = userID)
                    OR p.product_id IN (SELECT keywords.product_id
                                        FROM keywords
                                        WHERE keyword IN (SELECT interest
                                                          FROM interests
                                                                   INNER JOIN users_interests ui ON interests.id = ui.interest_id
                                                          WHERE user_id = userID));
END
$$
    language plpgsql;



CREATE OR REPLACE FUNCTION searchForProducts(searchQuery varchar)
    RETURNS TABLE
            (
                store_id    int,
                id          int,
                name        varchar(50),
                description varchar(200),
                quantity    int,
                price       float
            )
AS
$$
BEGIN
    RETURN QUERY SELECT some_products.store_id,
                        some_products.product_id,
                        some_products.name,
                        some_products.description,
                        some_products.quantity,
                        some_products.price
                 FROM (SELECT *
                       FROM products
                                INNER JOIN products_categories pc ON products.id = pc.product_id
                                INNER JOIN categories c ON c.id = pc.category_id) AS some_products
                 WHERE SIMILARITY(some_products.category, searchQuery) > .7
                    OR SIMILARITY(some_products.name, searchQuery) > .3
                    OR some_products.product_id IN
                       (SELECT keywords.product_id FROM keywords WHERE SIMILARITY(keyword, searchQuery) > .6);
END;
$$
    language plpgsql;



CREATE OR REPLACE FUNCTION searchForProducts2(searchQuery varchar)
    RETURNS TABLE
            (
                store_id    int,
                id          int,
                name        varchar(50),
                description varchar(200),
                quantity    int,
                price       float
            )
AS
$$
BEGIN
    RETURN QUERY SELECT products.store_id,
                        products.id,
                        products.name,
                        products.description,
                        products.quantity,
                        products.price
                 FROM products
                          INNER JOIN products_categories pc ON products.id = pc.product_id
                          INNER JOIN categories c ON c.id = pc.category_id
                 WHERE SIMILARITY(category, searchQuery) > .6
                    OR SIMILARITY(products.name, searchQuery) > .3
                    OR product_id IN
                       (SELECT keywords.product_id FROM keywords WHERE SIMILARITY(keyword, searchQuery) > .5);
END ;
$$
    language plpgsql;



CREATE OR REPLACE FUNCTION searchForStores(searchQuery varchar)
    RETURNS TABLE
            (
                store_id   int,
                name       varchar(30),
                phone      varchar(15),
                address    varchar(30),
                store_type varchar(15),
                pfp_url    varchar(150),
                cover_url  varchar(150)
            )
AS
$$
BEGIN
    RETURN QUERY SELECT u.id,
                        u.name,
                        si.phone,
                        si.address,
                        si.store_type,
                        si.pfp_url,
                        si.cover_url
                 FROM users u
                          INNER JOIN store_info si ON u.id = si.store_id
                 WHERE SIMILARITY(u.name, searchQuery) > .5
                    OR store_type LIKE searchQuery;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION placeNewOrder(st_id int, us_id int, address_ varchar, phone_ varchar, city_ varchar,
                                         zip_ varchar) RETURNS INT AS
$$
DECLARE
    orderID int;
BEGIN
    INSERT INTO orders (store_id, user_id, order_date, order_status, address, phone, city, zip)
    VALUES (st_id, us_id, NOW(), 'pending', address_, phone_, city_, zip_)
    RETURNING id INTO orderID;

    INSERT INTO store_notifications (store_id, notification, timestamp)
    VALUES (st_id, 'Kreirana nova narudžba', NOW());

    return orderID;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION updateOrderStatus(orderId int, orderStatus varchar(20)) RETURNS VOID AS
$$
BEGIN
    IF orderStatus = 'declined' THEN
        DELETE FROM orders WHERE id = orderId;
        DELETE FROM order_items WHERE order_id = orderId;
    ELSE
        UPDATE orders SET order_status = orderStatus WHERE id = orderId;
    END IF;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION cancelOrder(orderID int) RETURNS VOID
AS
$$
BEGIN
    INSERT INTO store_notifications (store_id, notification, timestamp)
    VALUES ((SELECT DISTINCT store_id FROM orders WHERE id = orderID),
            CONCAT('Korisnik je otkazao narudžbu sa rednim brojem ', orderID), NOW());
    DELETE FROM orders WHERE id = orderID;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION updateStoreInfo(st_id int, name_ varchar, phone_ varchar, address_ varchar) RETURNS VOID AS
$$
BEGIN
    UPDATE users SET name = name_ WHERE id = st_id;
    UPDATE store_info
    SET phone   = phone_,
        address = address_
    WHERE store_id = st_id;
END;

$$
    language plpgsql;


CREATE OR REPLACE FUNCTION deleteProduct(p_id int) RETURNS VOID AS
$$
BEGIN
    DELETE FROM product_images WHERE product_id = p_id;
    DELETE FROM products_categories WHERE product_id = p_id;
    DELETE FROM keywords WHERE product_id = p_id;
    DELETE FROM products WHERE id = p_id;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION updateProductImages(p_id int, img1 varchar(100), img2 varchar(100),
                                               img3 varchar(100)) RETURNS VOID AS
$$
BEGIN
    IF img1 IS NOT NULL THEN
        UPDATE product_images SET img_url = img1 WHERE product_id = p_id AND img_number = 1;
    END IF;
    IF img2 IS NOT NULL THEN
        UPDATE product_images SET img_url = img2 WHERE product_id = p_id AND img_number = 2;
    END IF;
    IF img3 IS NOT NULL THEN
        UPDATE product_images SET img_url = img3 WHERE product_id = p_id AND img_number = 3;
    END IF;
END;
$$
    language plpgsql;


CREATE OR REPLACE FUNCTION getProductsByPopularity()
    RETURNS TABLE
            (
                id               int,
                store_id         int,
                name             varchar(50),
                description      varchar(200),
                quantity         int,
                price            float,
                number_of_orders bigint,
                average_rating   float
            )
AS
$$
BEGIN
    RETURN QUERY SELECT products.id,
                        products.store_id,
                        products.name,
                        products.description,
                        products.quantity,
                        products.price,
                        COUNT(DISTINCT order_id) AS number_of_orders,
                        AVG(rating)              AS average_rating
                 FROM products
                          INNER JOIN product_images pi on products.id = pi.product_id
                          INNER JOIN product_reviews pr on products.id = pr.product_id
                          INNER JOIN order_items oi on pi.product_id = oi.product_id
                 GROUP BY products.id, products.store_id, products.name, products.price, products.quantity,
                          products.description
                 ORDER BY number_of_orders, average_rating;
END;

$$ language plpgsql;



CREATE OR REPLACE FUNCTION blockUser(userID int, isPermanent bool) RETURNS VOID AS
$$

BEGIN
    INSERT INTO blocked_users (user_id, is_permanent, time_stamp)
    VALUES (userID, isPermanent, NOW())
    ON CONFLICT (user_id) DO UPDATE
        SET is_permanent = isPermanent, time_stamp = NOW();
    UPDATE users SET status = 'blocked' WHERE id = userID;
END;

$$
    language plpgsql;


CREATE OR REPLACE FUNCTION unblockUser(userID int) RETURNS VOID AS
$$
DECLARE
    isUnbanned bool;
BEGIN
    SELECT time_stamp + interval '15' day < NOW()
    FROM blocked_users
    WHERE user_id = userID
      AND is_permanent = false
    INTO isUnbanned;
    IF isUnbanned THEN
        UPDATE users SET status = 'inactive' WHERE id = userID;
        DELETE FROM blocked_users WHERE user_id = userID;
    END IF;
END;
$$
    language plpgsql;

