# 有名SA・PA 100か所と、その名物(おすすめ)の一覧を web/src/sa_reco.json に書き出す。
# 出典はガイド記事(主に「るるぶKids」の路線別おすすめSA・PA記事)。メニューは変わることがあるので、
# アプリでは「〜がおすすめらしい」という言い方にしている。
# 書式: 名前(基本名)|種別|都道府県コード|路線|出典キー|向き=ja/zh/ko/en;向き=...
#   向き: all(上下共通) / dn(下り) / up(上り)。最初に書いた向きが「向きが分からないとき」に使われる。
import json, os

SRC = {
 'A': ('道央道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62622/'),
 'B': ('道央道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62620/'),
 'C': ('東北道【下り】るるぶKids', 'https://kids.rurubu.jp/article/58137/'),
 'D': ('東北道【上り】るるぶKids', 'https://kids.rurubu.jp/article/58140/'),
 'E': ('磐越道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62594/'),
 'F': ('寒河江SA るるぶKids', 'https://kids.rurubu.jp/article/sapa/80004691/'),
 'G': ('常磐道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62596/'),
 'H': ('関東のおすすめSA・PA るるぶKids', 'https://kids.rurubu.jp/article/52473/'),
 'I': ('東名【下り】るるぶKids', 'https://kids.rurubu.jp/article/62610/'),
 'J': ('東名【上り】るるぶKids', 'https://kids.rurubu.jp/article/62608/'),
 'K': ('海老名SAのテイクアウトグルメ JAF Mate', 'https://jafmate.jp/drive/must-buy-souvenir_20260424.html'),
 'L': ('海老名SAのメロンパン くるまのニュース', 'https://kuruma-news.jp/post/642876'),
 'M': ('大黒PA るるぶ&more.', 'https://rurubu.jp/andmore/spot/80120594'),
 'N': ('京葉道路・館山道【下り】・アクアライン るるぶKids', 'https://kids.rurubu.jp/article/62630/'),
 'O': ('東関東道 るるぶKids', 'https://kids.rurubu.jp/article/62624/'),
 'P': ('関越道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62602/'),
 'Q': ('関越道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62600/'),
 'R': ('上信越道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62634/'),
 'S': ('上信越道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62632/'),
 'T': ('中央道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62614/'),
 'U': ('中央道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62612/'),
 'V': ('長野道 るるぶKids', 'https://kids.rurubu.jp/article/162089/'),
 'W': ('北陸道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62638/'),
 'X': ('北陸道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62636/'),
 'Y': ('東海北陸道【下り】るるぶKids', 'https://kids.rurubu.jp/article/162139/'),
 'Z': ('東海北陸道【上り】るるぶKids', 'https://kids.rurubu.jp/article/162135/'),
 'AA': ('名神・新名神【下り】るるぶKids', 'https://kids.rurubu.jp/article/58859/'),
 'AB': ('名神・新名神【上り】るるぶKids', 'https://kids.rurubu.jp/article/58857/'),
 'AC': ('刈谷PA【下り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80110014/'),
 'AD': ('新東名【下り】るるぶKids', 'https://kids.rurubu.jp/article/62618/'),
 'AE': ('新東名【上り】るるぶKids', 'https://kids.rurubu.jp/article/62616/'),
 'AF': ('西紀SA【下り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80030693/'),
 'AG': ('山陽道【下り】るるぶKids', 'https://kids.rurubu.jp/article/58851/'),
 'AH': ('山陽道【上り】るるぶKids', 'https://kids.rurubu.jp/article/58849/'),
 'AI': ('神戸淡路鳴門道・瀬戸中央道・西瀬戸道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62646/'),
 'AJ': ('神戸淡路鳴門道・瀬戸中央道・西瀬戸道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62644/'),
 'AK': ('阪和道【下り】るるぶKids', 'https://kids.rurubu.jp/article/162394/'),
 'AL': ('東名阪道・伊勢道【下り】るるぶKids', 'https://kids.rurubu.jp/article/62642/'),
 'AM': ('伊勢道・東名阪道【上り】るるぶKids', 'https://kids.rurubu.jp/article/62640/'),
 'AN': ('中国道【下り】るるぶKids', 'https://kids.rurubu.jp/article/162375/'),
 'AO': ('中国道【上り】るるぶKids', 'https://kids.rurubu.jp/article/162381/'),
 'AP': ('めかりPA【上り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80079247/'),
 'AQ': ('豊浜SA【下り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80036106/'),
 'AR': ('石鎚山SA【上り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80036766/'),
 'AS': ('伊予灘SA【下り】るるぶKids', 'https://kids.rurubu.jp/article/sapa/80036826/'),
 'AT': ('中国・四国のおすすめSA・PA るるぶKids', 'https://kids.rurubu.jp/article/53103/'),
 'AU': ('九州道【下り】るるぶKids', 'https://kids.rurubu.jp/article/58855/'),
 'AV': ('九州道【上り】るるぶKids', 'https://kids.rurubu.jp/article/58853/'),
 'AW': ('九州のSA・PAの人気グルメ るるぶKids', 'https://kids.rurubu.jp/article/105805/'),
}

DATA = r'''
輪厚|PA|JP-01|道央道|A,B|dn=ふらの雪どけチーズケーキ/富良野融雪芝士蛋糕/후라노 눈녹이 치즈케이크/Furano snowmelt cheesecake;up=笹豚丼/笹猪肉盖饭/사사부타동/Sasabuta pork bowl
有珠山|SA|JP-01|道央道|A,B|dn=黄金豚のねぎ塩豚丼/黄金猪葱盐猪肉盖饭/고가네톤 파소금 돼지덮밥/Koganeton pork bowl with green onion and salt;up=黄金豚のしょうが焼き/黄金猪姜汁烧肉/고가네톤 생강구이/Koganeton ginger pork
砂川|SA|JP-01|道央道|A,B|dn=砂川ポークチャップ/砂川猪排/스나가와 포크찹/Sunagawa pork chop;up=豚丼/北海道猪肉盖饭/부타동/Hokkaido butadon pork bowl
津軽|SA|JP-02|東北道|D|up=りんごスティック/苹果条酥/사과 스틱 파이/apple stick pastries
岩手山|SA|JP-03|東北道|C,D|up=盛岡冷麺/盛冈冷面/모리오카 냉면/Morioka reimen;dn=菜彩鶏の親子丼/菜彩鸡亲子丼/사이사이도리 오야코동/Saisaidori oyakodon
紫波|SA|JP-03|東北道|C,D|up=いわて牛乳ソフト/岩手牛奶霜淇淋/이와테 우유 소프트아이스크림/Iwate milk soft serve;dn=白金豚のカツ丼/白金猪炸猪排盖饭/하쿠킨톤 가쓰동/Hakkinton pork katsudon
前沢|SA|JP-03|東北道|C,D|up=前沢牛の牛丼/前泽牛牛肉盖饭/마에사와규 규동/Maesawa beef bowl;dn=奥州ポテト/奥州薯点心/오슈 포테이토/Oshu Potato sweets
長者原|SA|JP-04|東北道|C,D|up=たん塩丼/盐味牛舌盖饭/소혀 소금구이 덮밥/salted beef tongue bowl;dn=支倉焼/支仓烧/하세쿠라야키/Hasekura-yaki pastries
菅生|PA|JP-04|東北道|C,D|up=牛たん麦めし丼/牛舌麦饭盖饭/소혀 보리밥 덮밥/beef tongue on barley rice;dn=仙台味噌ラーメン/仙台味噌拉面/센다이 된장라멘/Sendai miso ramen
国見|SA|JP-07|東北道|C,D|dn=伊達鶏の釜飯/伊达鸡釜饭/다테도리 가마메시/Date chicken kamameshi;up=国見あつかしの月/国见阿津贺志之月/구니미 아쓰카시노쓰키/Kunimi Atsukashi no Tsuki sweets
安達太良|SA|JP-07|東北道|C,D|up=郡山ブラックラーメン/郡山黑拉面/고리야마 블랙 라멘/Koriyama black ramen;dn=伊達鶏しょうゆカツバーガー/伊达鸡酱油炸鸡排汉堡/다테도리 간장 가쓰버거/Date chicken soy cutlet burger
磐梯山|SA|JP-07|磐越道|E|dn=会津ソースカツ丼/会津酱汁炸猪排盖饭/아이즈 소스 가쓰동/Aizu sauce katsudon
寒河江|SA|JP-06|山形道|F|all=さくらんぼソフトクリーム/樱桃霜淇淋/체리 소프트아이스크림/cherry soft serve
南相馬鹿島|SA|JP-07|常磐道|G|all=なみえ焼きそば/浪江炒面/나미에 야키소바/Namie yakisoba
蓮田|SA|JP-11|東北道|C,D|dn=紫いものスイートポテト/紫薯甜薯点心/자색고구마 스위트포테이토/purple sweet potato sweets;up=彩果の宝石/彩果宝石水果软糖/사이카노호세키 과일젤리/Saika no Hoseki fruit jellies
羽生|PA|JP-11|東北道|C,D|up=盗人ごまだれ餅/盗人芝麻酱年糕/누스비토 깨소스 떡/Nusubito sesame mochi;dn=ずんだシェイク/毛豆奶昔/즌다 셰이크/zunda edamame shake
佐野|SA|JP-09|東北道|C,D|all=佐野ラーメン/佐野拉面/사노 라멘/Sano ramen
上河内|SA|JP-09|東北道|C,D,H|all=宇都宮餃子/宇都宫饺子/우쓰노미야 교자/Utsunomiya gyoza
那須高原|SA|JP-09|東北道|C,D|all=御用邸チーズケーキ/御用邸芝士蛋糕/고요테이 치즈케이크/Goyotei cheesecake
海老名|SA|JP-14|東名|I,K,L|dn=海老名メロンパン/海老名菠萝包/에비나 멜론빵/Ebina melon bread;up=海老名カレーパン/海老名咖喱面包/에비나 카레빵/Ebina curry bread
中井|PA|JP-14|東名|I,J|up=鈴廣のあげかま/铃广炸鱼糕/스즈히로 튀김 어묵/Suzuhiro fried fish cakes;dn=崎陽軒のシウマイ/崎阳轩烧卖/기요켄 슈마이/Kiyoken shumai
大黒|PA|JP-14|首都高|M|all=牛鍋/牛锅/규나베/gyunabe beef hotpot
海ほたる|PA|JP-12|東京湾アクアライン|N|all=あさりの塩ラーメン/蛤蜊盐味拉面/바지락 소금라멘/clam salt ramen
酒々井|PA|JP-12|東関東道|O|dn=ぴーなつ最中/花生最中/땅콩 모나카/peanut monaka;up=ピーナッツラングドシャ/花生猫舌饼/땅콩 랑그드샤/peanut langue de chat
三芳|PA|JP-11|関越道|P,Q|up=わらじタレかつ丼/草鞋酱汁炸猪排盖饭/와라지 소스 가쓰동/waraji sauce katsudon;dn=狭山茶つつみ焼/狭山茶包烧/사야마차 쓰쓰미야키/Sayama tea pastry
高坂|SA|JP-11|関越道|Q|up=肉汁うどん/肉汁乌冬面/니쿠지루 우동/nikujiru dipping udon
嵐山|PA|JP-11|関越道|P,Q|dn=嵐山プリン/岚山布丁/란잔 푸딩/Ranzan pudding;up=ブラックソフトクリーム/黑色霜淇淋/블랙 소프트아이스크림/black soft serve
寄居|PA|JP-11|関越道|P,Q|dn=みそだれ豚丼/味噌酱猪肉盖饭/된장소스 돼지덮밥/miso-glazed pork bowl;up=秩父味噌カツ丼/秩父味噌炸猪排盖饭/지치부 된장 가쓰동/Chichibu miso katsudon
赤城高原|SA|JP-10|関越道|P,Q|dn=赤城メープルミルクケーキ/赤城枫糖牛奶蛋糕/아카기 메이플 밀크 케이크/Akagi maple milk cake;up=シャンゴ風スパゲティー/尚戈风味意大利面/샹고풍 스파게티/Shango-style spaghetti
横川|SA|JP-10|上信越道|S,H|all=峠の釜めし/峠之釜饭/도게노 가마메시/Toge no Kamameshi
石川|PA|JP-13|中央道|T,U|all=八王子ラーメン/八王子拉面/하치오지 라멘/Hachioji ramen
談合坂|SA|JP-19|中央道|T,U|dn=ほうとう/馎饦面/호토/hoto noodles;up=甲州味噌かつ丼/甲州味噌炸猪排盖饭/고슈 된장 가쓰동/Koshu miso katsudon
双葉|SA|JP-19|中央道|T,U|dn=桔梗信玄餅/桔梗信玄饼/기쿄 신겐모치/Kikyo Shingen mochi;up=ホルモンラーメン/内脏拉面/호르몬 라멘/horumon offal ramen
八ヶ岳|PA|JP-19|中央道|T,U|up=清里ミルクドーナツ/清里牛奶甜甜圈/기요사토 밀크 도넛/Kiyosato milk doughnuts;dn=みるく餅/牛奶年糕/밀크 떡/milk mochi
諏訪湖|SA|JP-20|中央道|T,U|up=信州味噌ラーメン/信州味噌拉面/신슈 된장라멘/Shinshu miso ramen;dn=テンホウの餃子/Tenhou饺子/텐호 교자/Tenhou gyoza
駒ヶ岳|SA|JP-20|中央道|T,U|up=ソースかつ丼/酱汁炸猪排盖饭/소스 가쓰동/sauce katsudon;dn=すずらん牛乳ソフトクリーム/铃兰牛奶霜淇淋/스즈란 우유 소프트아이스크림/Suzuran milk soft serve
姨捨|SA|JP-20|長野道|V|dn=長芋のかき揚げ丼/山药天妇罗盖饭/참마 가키아게 덮밥/Chinese yam tempura bowl;up=満月りんご/满月苹果点心/만게쓰 링고/Mangetsu Ringo apple sweets
小布施|PA|JP-20|上信越道|R,S|all=栗おこわ/栗子糯米饭/밤 찹쌀밥/chestnut sticky rice
越後川口|SA|JP-15|関越道|P,Q|up=へぎ天そば/片木荞麦面配天妇罗/헤기 덴소바/hegi soba with tempura;dn=あねさわっぱ飯/阿姐木盒饭/아네사 왓파메시/Anesa wappa rice
米山|SA|JP-15|北陸道|W,X|dn=サバサンド/鲭鱼三明治/고등어 샌드위치/mackerel sandwich;up=鯛茶漬け/鲷鱼茶泡饭/도미 오차즈케/sea bream ochazuke
有磯海|SA|JP-16|北陸道|W,X|dn=ますの寿し/鳟鱼寿司/송어 초밥/masu trout sushi;up=富山ゴールドラーメン/富山金色拉面/도야마 골드 라멘/Toyama gold ramen
越中境|PA|JP-16|北陸道|W,X|all=白えびかき揚げそば/白虾天妇罗荞麦面/흰새우 가키아게 소바/white shrimp tempura soba
尼御前|SA|JP-17|北陸道|W,X|dn=能登豚のとんかつ/能登猪炸猪排/노토 돼지 돈가스/Noto pork tonkatsu;up=娘娘饅頭/娘娘馒头/냥냥 만주/Nyan-nyan manju
南条|SA|JP-18|北陸道|W,X|dn=ソースカツ丼/酱汁炸猪排盖饭/소스 가쓰동/sauce katsudon;up=ボルガライス/博尔加饭/보르가 라이스/Volga rice
杉津|PA|JP-18|北陸道|W|dn=越前おろしそば/越前萝卜泥荞麦面/에치젠 오로시 소바/Echizen grated-radish soba
ひるがの高原|SA|JP-21|東海北陸道|Y,Z|dn=けいちゃん丼/味噌炒鸡肉盖饭/게이짱 덮밥/keichan chicken bowl;up=ひるがの高原牛乳/蛭野高原牛奶/히루가노 고원 우유/Hirugano Kogen milk
養老|SA|JP-21|名神|AA,AB|up=栗きんとん/栗金团/구리킨톤/kuri-kinton chestnut sweets;dn=楽山ぷりん/乐山布丁/라쿠잔 푸딩/Rakuzan pudding
豊田上郷|SA|JP-23|東名|I,J|dn=みそかつ丼ときしめん/味噌炸猪排盖饭配棊子面/미소카쓰동과 기시멘/miso katsudon with kishimen;up=西尾の抹茶クッキー/西尾抹茶曲奇/니시오 말차 쿠키/Nishio matcha cookies
刈谷|PA|JP-23|伊勢湾岸道|AC|dn=手羽先唐揚げ/名古屋炸鸡翅/데바사키 가라아게/Nagoya-style chicken wings
岡崎|SA|JP-23|新東名|AD,AE|all=名古屋コーチン親子丼/名古屋交趾鸡亲子丼/나고야 코친 오야코동/Nagoya Cochin oyakodon
浜名湖|SA|JP-22|東名|I,J|all=浜名湖みかんカステラ/滨名湖橘子蜂蜜蛋糕/하마나코 귤 카스텔라/Lake Hamana mandarin castella
浜松|SA|JP-22|新東名|AD,AE|all=浜松餃子/滨松饺子/하마마쓰 교자/Hamamatsu gyoza
静岡|SA|JP-22|新東名|AD,AE|up=しぞーかおでん/静冈关东煮/시즈오카 오뎅/Shizuoka oden;dn=安倍川もち/安倍川年糕/아베카와 모치/Abekawa mochi
駿河湾沼津|SA|JP-22|新東名|AD,AE|up=ミルクカップシュー/牛奶杯泡芙/밀크 컵 슈/milk cup cream puffs;dn=いちごのミルフィーユ/草莓千层酥/딸기 밀푀유/strawberry mille-feuille
富士川|SA|JP-22|東名|I,J|up=あしたか牛しゃぶラーメン/爱鹰牛涮涮锅拉面/아시타카규 샤부 라멘/Ashitaka beef shabu ramen;dn=富士山御蔭餅/富士山御荫饼/후지산 오카게모치/Mt. Fuji Okage mochi
牧之原|SA|JP-22|東名|I,J|dn=茶そば/茶荞麦面/녹차 소바/green tea soba;up=あじ丼とアジフライ/竹荚鱼盖饭和炸竹荚鱼/전갱이 덮밥과 전갱이 튀김/horse mackerel bowl and fried horse mackerel
足柄|SA|JP-22|東名|I|dn=金太郎の力もちあんぱん/金太郎力饼红豆面包/긴타로 지카라모치 단팥빵/Kintaro chikara-mochi anpan
鮎沢|PA|JP-22|東名|I,J|dn=丹沢あんぱん/丹泽红豆面包/단자와 단팥빵/Tanzawa anpan;up=金太郎バウム/金太郎年轮蛋糕/긴타로 바움쿠헨/Kintaro baumkuchen
賤ヶ岳|SA|JP-25|北陸道|X|up=近江牛黄金丼/近江牛黄金盖饭/오미규 황금 덮밥/Omi beef golden bowl
多賀|SA|JP-25|名神|AA,AB|dn=近江ちゃんぽん/近江什锦面/오미 짬뽕/Omi champon;up=多賀のきんし丼/多贺锦丝鳗鱼盖饭/다가 긴시동/Taga kinshi eel bowl
草津|PA|JP-25|名神|AA,AB|dn=三井寺力餅/三井寺力饼/미이데라 지카라모치/Miidera chikara-mochi;up=京ばあむ/京都年轮蛋糕/교바움/Kyo-baum
大津|SA|JP-25|名神|AA,AB|up=近江牛焼肉重/近江牛烤肉饭盒/오미규 야키니쿠 주/Omi beef yakiniku box;dn=びわ湖蜜香カステラケーキ/琵琶湖蜜香蜂蜜蛋糕/비와코 밋코 카스텔라 케이크/Lake Biwa honey castella cake
土山|SA|JP-25|新名神|AA,AB|all=近江牛ステーキ/近江牛牛排/오미규 스테이크/Omi beef steak
桂川|PA|JP-26|名神|AA,AB|up=京ゆば丼/京都豆腐皮盖饭/교유바동/Kyoto yuba bowl;dn=丹波黒どりのすき焼き丼/丹波黑鸡寿喜烧盖饭/단바 흑닭 스키야키 덮밥/Tamba black chicken sukiyaki bowl
吹田|SA|JP-27|名神|AA,AB|up=元祖大阪みたらしだんご/元祖大阪御手洗团子/원조 오사카 미타라시 당고/original Osaka mitarashi dango;dn=なにわカスうどん/浪速油渣乌冬面/나니와 카스 우동/Naniwa kasu udon
宝塚北|SA|JP-28|新名神|AA,AB|all=丹波朝霧どりの骨付きもも焼き/丹波朝雾鸡带骨烤鸡腿/단바 아사기리 닭다리 구이/roast Tamba Asagiri chicken leg
西紀|SA|JP-28|舞鶴若狭道|AF|dn=踊りたこやき/跳舞章鱼烧/오도리 다코야키/odori takoyaki with a whole baby octopus
三木|SA|JP-28|山陽道|AG,AH|up=かつめし/加古川炸牛排饭/가쓰메시/Kakogawa katsumeshi;dn=丹波黒大福/丹波黑豆大福/단바 검은콩 다이후쿠/Tamba black bean daifuku
淡路|SA|JP-28|神戸淡路鳴門道|AI,AJ|dn=しらすとわかめの丼/吻仔鱼裙带菜盖饭/잔멸치 미역 덮밥/whitebait and wakame bowl;up=淡路玉ねぎの醤油ラーメン/淡路洋葱酱油拉面/아와지 양파 간장라멘/Awaji onion shoyu ramen
岸和田|SA|JP-27|阪和道|AK|dn=がっちょの唐揚げ/泉州炸小鱼/갓초 튀김/fried gaccho fish
紀ノ川|SA|JP-30|阪和道|AK|dn=紀州しらす丼/纪州吻仔鱼盖饭/기슈 잔멸치 덮밥/Kishu whitebait bowl
御在所|SA|JP-24|東名阪道|AL,AM|up=赤福餅/赤福饼/아카후쿠모치/Akafuku mochi;dn=金シャチきしめん/金鯱棊子面/긴샤치 기시멘/Kinshachi kishimen
安濃|SA|JP-24|伊勢道|AL,AM|up=あおさ伊勢うどん/石莼伊势乌冬/아오사 이세 우동/aosa seaweed Ise udon;dn=松阪牛ラーメン/松阪牛拉面/마쓰사카규 라멘/Matsusaka beef ramen
吉備|SA|JP-33|山陽道|AG,AH|up=藤戸饅頭/藤户馒头/후지토 만주/Fujito manju;dn=デミカツ丼/多蜜酱炸猪排盖饭/데미 가쓰동/demi-glace katsudon
瀬戸|PA|JP-33|山陽道|AG|dn=きびだんご/吉备团子/기비당고/kibi dango
福山|SA|JP-34|山陽道|AG,AH|all=尾道ラーメン/尾道拉面/오노미치 라멘/Onomichi ramen
小谷|SA|JP-34|山陽道|AG,AH|dn=八天堂のクリームパン/八天堂奶油面包/핫텐도 크림빵/Hattendo cream bun;up=あたらしもみじ/新红叶点心/아타라시 모미지/Atarashi Momiji sweets
宮島|SA|JP-34|山陽道|AG,AH|dn=カキフライ/炸牡蛎/굴튀김/fried oysters;up=安芸のよくばり丼/安艺豪华盖饭/아키 욕심쟁이 덮밥/Aki "greedy" rice bowl
下松|SA|JP-35|山陽道|AG|dn=下松牛骨ラーメン/下松牛骨拉面/구다마쓰 소뼈 라멘/Kudamatsu beef-bone ramen
美東|SA|JP-35|中国道|AN,AO|up=瓦そば/瓦片荞麦面/가와라소바/kawara soba;dn=生外郎/生外郎糕/나마 우이로/fresh uiro
めかり|PA|JP-40|関門道|AP|up=関門海峡丼/关门海峡盖饭/간몬 해협 덮밥/Kanmon Straits bowl
真庭|PA|JP-33|中国道|AN,AO|all=蒜山焼そば/蒜山炒面/히루젠 야키소바/Hiruzen yakisoba
与島|PA|JP-37|瀬戸中央道|AI,AJ|all=瀬戸のしらす丼/濑户吻仔鱼盖饭/세토 잔멸치 덮밥/Seto whitebait bowl
豊浜|SA|JP-37|高松道|AQ|dn=いりこ塩ラーメン/小鱼干盐味拉面/이리코 소금라멘/iriko salt ramen
石鎚山|SA|JP-38|松山道|AR|up=一六タルトの天ぷら/一六挞天妇罗/이치로쿠 타르트 튀김/Ichiroku tart tempura
伊予灘|SA|JP-38|松山道|AS|dn=今治焼豚玉子飯/今治叉烧鸡蛋饭/이마바리 야키부타 다마고메시/Imabari roast pork and egg rice
来島海峡|SA|JP-38|西瀬戸道|AI,AJ|all=宇和島風鯛めし/宇和岛风味鲷鱼饭/우와지마식 도미밥/Uwajima-style sea bream rice
瀬戸田|PA|JP-34|西瀬戸道|AJ|up=瀬戸田レモンケーキ/濑户田柠檬蛋糕/세토다 레몬 케이크/Setoda lemon cake
南国|SA|JP-39|高知道|AT|all=カツオのたたき/炙烤鲣鱼/가다랑어 다타키/seared bonito
古賀|SA|JP-40|九州道|AU,AW|dn=ゴマさば丼/芝麻鲭鱼盖饭/고마사바 덮밥/sesame mackerel bowl;up=真鯛の茶漬け/真鲷茶泡饭/참돔 오차즈케/red sea bream ochazuke
基山|PA|JP-41|九州道|AU,AV|all=肉うどん/肉乌冬面/니쿠 우동/beef udon
山川|PA|JP-40|九州道|AU,AV|all=山川ラーメン/山川拉面/야마카와 라멘/Yamakawa ramen
北熊本|SA|JP-43|九州道|AU,AW|up=太平燕/太平燕/타이피엔/taipien noodle soup;dn=熊本ラーメン/熊本拉面/구마모토 라멘/Kumamoto ramen
宮原|SA|JP-43|九州道|AW|all=角煮ラーメン/东坡肉拉面/가쿠니 라멘/braised pork ramen
えびの|PA|JP-45|九州道|AV,AW|all=和風日南とりラーメン/和风日南鸡肉拉面/와후 니치난 닭 라멘/Nichinan chicken ramen
桜島|SA|JP-46|九州道|AU,AV|dn=黒豚とんかつ/黑猪炸猪排/흑돼지 돈가스/Kurobuta tonkatsu;up=黒豚と桜島どりのダブル丼/黑猪和樱岛鸡双拼盖饭/흑돼지와 사쿠라지마 닭 더블 덮밥/Kurobuta and Sakurajima chicken bowl
大村湾|PA|JP-42|長崎道|AW|up=角煮まん/东坡肉包/가쿠니만/braised pork bun
別府湾|SA|JP-44|東九州道|AW|all=別府湾しらす丼/别府湾吻仔鱼盖饭/벳푸만 잔멸치 덮밥/Beppu Bay whitebait bowl
玖珠|SA|JP-44|大分道|AW|all=とり天/鸡肉天妇罗/도리텐/toriten chicken tempura
山之口|SA|JP-45|宮崎道|AW|all=チキン南蛮カレー/南蛮炸鸡咖喱/치킨 난반 카레/chicken nanban curry
'''

out = []
for line in DATA.strip().splitlines():
    n, k, p, r, src, items = line.split('|')
    e = {'n': n, 'k': k, 'p': p, 'r': r}
    for part in items.split(';'):
        d, v = part.split('=')
        ja, zh, ko, en = v.split('/')
        e[d] = {'ja': ja, 'zh': zh, 'ko': ko, 'en': en}
    e['s'] = src.split(',')
    out.append(e)
names = [e['n'] for e in out]
assert len(out) == 100, len(out)
assert len(set(names)) == 100, [x for x in names if names.count(x) > 1]
for e in out:
    for s in e['s']: assert s in SRC, s
used = sorted({s for e in out for s in e['s']}, key=lambda s: (len(s), s))
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
with open(os.path.join(root, 'web/src/sa_reco.json'), 'w', encoding='utf-8') as f:
    json.dump({'src': {s: SRC[s] for s in used}, 'list': out}, f, ensure_ascii=False, separators=(',', ':'))
print(len(out), '件,', sum(1 for e in out for d in ('all', 'up', 'dn') if d in e), '品,', len(used), '出典')
