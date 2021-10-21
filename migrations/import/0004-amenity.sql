
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Wifi","vi":"Wifi"}', 'wifi', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Fan","vi":"Quạt"}', 'fan', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Private entrance","vi":"Lối đi riêng"}', 'private_entrance', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Hair-dryer","vi":"Máy sấy"}', 'hair-dryer', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Water heater","vi":"Bình nóng lạnh"}', 'water_heater', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Washing machine","vi":"Máy giặt"}', 'washing_machine', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Detergent","vi":"Bột giặt/Nước giặt"}', 'detergent', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Clothes dryer","vi":"Máy sấy quần áo"}', 'clothes_dryer', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Babies/Toddlers welcome","vi":"Phù hợp cho trẻ nhỏ"}', 'babies/toddlers_welcome', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Toddler crib","vi":"Cũi cho trẻ nhỏ"}', 'toddler_crib', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Working desk","vi":"Bàn làm việc"}', 'working_desk', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Iron/Iron board","vi":"Bàn là/Bàn ủi"}', 'iron/iron_board', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Refrigerator","vi":"Tủ lạnh"}', 'refrigerator', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Drying rack","vi":"Giá phơi quần áo"}', 'drying_rack', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Slippers","vi":"Dép"}', 'slippers', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Cleaning tools","vi":"Dụng cụ dọn dẹp"}', 'cleanin_tools', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Air-conditioner","vi":"Điều hòa"}', 'air-conditioner', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Internet","vi":"Internet"}', 'internet', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Windows","vi":"Cửa sổ"}', 'windows', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"TV","vi":"TV"}', 'tv', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Sofa","vi":"Ghế sofa"}', 'sofa', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"220V voltage socket","vi":"Ổ cắm điện 220V"}', '220v_voltage_socket', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"110V voltage socket","vi":"Ổ cắm điện 110V"}', '110v_voltage_socket', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Free drinkable water","vi":"Nước uống miễn phí"}', 'free_drinkable_water', (select id from public.amenitycategory where keyword = 'general'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Wardrobe","vi":"Tủ quần áo"}', 'wardrobe', (select id from public.amenitycategory where keyword = 'bedroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Clothes hangers","vi":"Móc treo quần áo"}', 'clothes_hangers', (select id from public.amenitycategory where keyword = 'bedroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Extra mattress","vi":"Đệm bổ sung"}', 'extra_mattress', (select id from public.amenitycategory where keyword = 'bedroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Makeup desk","vi":"Bàn trang điểm"}', 'makeup_desk', (select id from public.amenitycategory where keyword = 'bedroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Balcony","vi":"Ban công"}', 'balcony', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Private BBQ area","vi":"Khu vực BBQ riêng"}', 'private_bbq_area', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Private Courtyard/Garden","vi":"Sân/Vườn riêng"}', 'private_courtyard/garden', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Private swimming pool","vi":"Bể bơi riêng"}', 'private_swimming_pool', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Private parking lot","vi":"Bãi đỗ xe riêng"}', 'private_parking_lot', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Massage chair","vi":"Ghế massage"}', 'massage_chair', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Tantra","vi":"Ghế tantra"}', 'tantra', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Smart house","vi":"Nhà thông minh"}', 'smart_house', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"First aid kits","vi":"Hộp y tế"}', 'first_aid_kits', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Coffee machine","vi":"Máy pha cà phê"}', 'coffee_machine', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Smart TV/Internet TV","vi":"Smart TV/Internet TV"}', 'smart_tv/internet_tv', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Karaoke","vi":"Karaoke"}', 'karaoke', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Jacuzzi","vi":"Jacuzzi"}', 'jacuzzi', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Speaker","vi":"Loa"}', 'speaker', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Mosquito net","vi":"Lưới chống muỗi"}', 'mosquito_net', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Playstation","vi":"Playstation"}', 'playstation', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Xbox","vi":"Xbox"}', 'xbox', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Fireplace","vi":"Lò sưởi"}', 'fireplace', (select id from public.amenitycategory where keyword = 'special_amenities'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Electric stove/Magnetic stove","vi":"Bếp điện/Bếp từ"}', 'electric_stove/magnetic_stove', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"BBQ grill","vi":"Bếp nướng BBQ"}', 'bbq_grill', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Gas stove","vi":"Bếp ga"}', 'gas_stove', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Hotpot","vi":"Nồi lẩu"}', 'hotpot', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Rice cooker","vi":"Nồi cơm điện"}', 'rice_cooker', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Kettle","vi":"Ấm đun nước"}', 'kettle', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Basic seasonings","vi":"Gia vị nấu ăn cơ bản"}', 'basic_seasonings', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Oven","vi":"Lò nướng"}', 'oven', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Microwave oven","vi":"Lò vi sóng"}', 'microwave_oven', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Toaster","vi":"Máy nướng bánh mì"}', 'toaster', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Cookwares","vi":"Dụng cụ nấu ăn"}', 'cookwares', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Dishwasher","vi":"Máy rửa bát"}', 'dishwasher', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Charcoal","vi":"Than củi"}', 'charcoal', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Eating utensils","vi":"Bát đĩa"}', 'eating_utensils', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Cups","vi":"Ly cốc"}', 'cups', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Dining table set","vi":"Bộ bàn ăn"}', 'dining_table set', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Tissue","vi":"Giấy ăn"}', 'tissue', (select id from public.amenitycategory where keyword = 'kitchen'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Bay view","vi":"View vịnh"}', 'bay_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"City view","vi":"View thành phố"}', 'city_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Sea view","vi":"View biển"}', 'sea_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Harbor view","vi":"View cảng"}', 'harbor_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"River view","vi":"View sông"}', 'river_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Lake view","vi":"View hồ"}', 'lake_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Mountain view","vi":"View núi đồi"}', 'mountain_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Pool view","vi":"View bể bơi"}', 'pool_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Garden view","vi":"View sân vườn"}', 'garden_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Park view","vi":"View công viên"}', 'park_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Forest view","vi":"View rừng cây"}', 'forest_view', (select id from public.amenitycategory where keyword = 'view'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Fire alarm","vi":"Còi báo cháy"}', 'fire_alarm', (select id from public.amenitycategory where keyword = 'safety'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Fire extinguisher","vi":"Bình chữa cháy"}', 'fire_extinguisher', (select id from public.amenitycategory where keyword = 'safety'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Anti-theft lock","vi":"Khóa chống trộm"}', 'anti-theft_lock', (select id from public.amenitycategory where keyword = 'safety'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Safe box","vi":"Két an toàn"}', 'safe_box', (select id from public.amenitycategory where keyword = 'safety'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Bath tub","vi":"Bồn tắm"}', 'bath_tub', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Shower booth","vi":"Buồng tắm đứng"}', 'shower_booth', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Toilet","vi":"Toilet"}', 'toilet', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Bathroom heater","vi":"Đèn sưởi nhà tắm"}', 'bathroom_heater', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Towels","vi":"Khăn tắm"}', 'towels', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Shampoo, Hair conditioner","vi":"Dầu gội, dầu xả"}', 'shampoo,_hair_conditioner', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Body wash/Soap","vi":"Sữa tắm/Xà phòng"}', 'body_wash/soap', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Towel paper","vi":"Giấy vệ sinh"}', 'towel_paper', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Toothpaste, Toothbrush","vi":"Kem/Bàn chải đánh răng"}', 'toothpaste,_toothbrush', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Shower cap","vi":"Mũ tắm"}', 'shower_cap', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Free toiletries","vi":"Đồ vệ sinh cá nhân miễn phí"}', 'free_toiletries', (select id from public.amenitycategory where keyword = 'bathroom'));
INSERT INTO public.amenity ("name", keyword, amenitycategoryid) VALUES('{"en":"Bidet sprayer","vi":"Vòi xịt"}', 'bidet_sprayer', (select id from public.amenitycategory where keyword = 'bathroom'));