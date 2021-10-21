CREATE MATERIALIZED view IF NOT EXISTS materializedviewlocations as
select 
  l.id as id, l.coordinates as coordinates, l.name as name, l.formatedaddress as formatedaddress,
  l.country as country, l.arealevel1 as arealevel1, l.arealevel2 as arealevel2, l.arealevel3 as arealevel3, l.arealevel4 as arealevel4, l.arealevel5 as arealevel5, l.status as status,
  l.locationtype as locationtype, l.totalreview as totalreview, l.averagepoint as averagepoint,
  l.createdat as createdat, l.updatedat as updatedat, l.userid as userid, l.address as address,
  l.latitude as latitude, l.longitude as longitude, 
  t.id as tourid, ptour.medias as tourmedias, t.destinations as tourdestinations, t.totaltourtime as totaltourtime,
  t.vehicleservices as tourvehicleservices, stour."name" as tourname, stour.price as tourprice, stour.id as tourserviceid,
  ctour.id as tourcurrencyid, ctour.code as tourcurrencycode, ctour.symbol as tourcurrencysymbol, ctour."text" as tourcurrencytext,
  pa.id as pageid,
  (CASE
	WHEN l.locationtype = 'WHERE' then (
    select posts.medias
    from public.posts posts
    where l.id = posts.locationid and posts.posttype = 'CREATED' and posts.deletedat is null and posts.pageid is null
    ORDER by posts.averagepoint desc limit 1
	)
	ELSE NULL
	end
  ) AS postmedias,
  pa.backgroundmedia as backgroundmedia, pa.avatarmedia as avatarmedia
from public.locations l
left join public.page pa on pa.locationid  = l.id
left join public.tour t on t.locationid  = l.id
left join public.service stour on t.serviceid  = stour.id
left join public.currency ctour on ctour.id = stour.currencyid
left join public.posts ptour on ptour.id = stour.postid;

CREATE UNIQUE INDEX IF NOT EXISTS mater_view_location_idx ON materializedviewlocations (id);

REFRESH MATERIALIZED VIEW CONCURRENTLY materializedviewlocations;
