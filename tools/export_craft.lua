-- KCD2RP Wiki: read local gamemode craft tables for documentation.
-- Usage: texlua --luaonly tools/export_craft.lua /path/to/gamemodes/localrp/server/modules output.json
-- IMPORTANT: GetItemInfo() below is a harmless stub, so catalog_ recipes are
-- CANDIDATES, not evidence that their native GUIDs exist on a running server.
local modules=assert(arg[1],'modules directory required')
local output=assert(arg[2],'output path required')
local RP={goods={},recipes={},houseLockTiers={}}
function Log(_) end
function GetItemInfo(guid) return {name=guid,display=guid,weight=1} end
for _,name in ipairs({'craft_data.lua','native_craft_data.lua','craft_catalog.lua'}) do
  local mod,why=loadfile(modules..'/'..name);assert(mod,why)
  mod()({RP=RP,horse={}})
end
local function quote(s)
  return '"'..tostring(s):gsub('[%z\1-\31\\"]',function(c)
    if c=='\\' then return '\\\\' end
    if c=='"' then return '\\"' end
    if c=='\n' then return '\\n' end
    if c=='\r' then return '\\r' end
    if c=='\t' then return '\\t' end
    return string.format('\\u%04x',string.byte(c))
  end)..'"'
end
local function json(value)
  if value==nil then return 'null' end
  local t=type(value)
  if t=='string' then return quote(value) end
  if t=='boolean' then return value and 'true' or 'false' end
  if t=='number' then return tostring(value) end
  if t~='table' then return 'null' end
  local n=0;local isarray=true
  for key in pairs(value)do
    if type(key)~='number' or key%1~=0 or key<1 then isarray=false;break end
    if key>n then n=key end
  end
  local chunks={}
  if isarray then
    for i=1,n do chunks[#chunks+1]=json(value[i])end
    return '['..table.concat(chunks,',')..']'
  end
  local keys={}
  for key in pairs(value)do keys[#keys+1]=key end
  table.sort(keys,function(a,b)return tostring(a)<tostring(b)end)
  for _,key in ipairs(keys)do chunks[#chunks+1]=quote(key)..':'..json(value[key])end
  return '{'..table.concat(chunks,',')..'}'
end
local out=assert(io.open(output,'wb'))
out:write(json({goods=RP.goods,recipes=RP.recipes,nativeCraftItems=RP.nativeCraftItems,nativeRecipes=RP.nativeRecipes,craftNames=RP.craftNames,stats=RP.craftCatalogStats}));out:close()
