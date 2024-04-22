const { solve1, solve2, solve3, solve4 } = require('../src/sudoku/sudoku');
const conv2Arr = s => s.split('').map(x => x === '.' ? 0 : Number(x));
const mysolve = xs => solve3(conv2Arr(xs)).join('');

test('sudoku easy ones', () => {
    expect(mysolve('.914.7..8.74.3.....8..2.9...2..4...6...2..5..8..5....1.37.1..5241...93..6.8......')).toEqual('591467238274938165386125974125743896769281543843596721937814652412659387658372419');
    expect(mysolve('2..863.......1259.1.8.946....3...18.7.1....3.6.9.2...7.3.647....6.158..25.....8.4')).toEqual('295863741346712598178594623423975186751486239689321457832647915964158372517239864');
    expect(mysolve('85...2.9......7.8......6.2.1.2.8...5....6...9..8.9...47.91..3...4.3..1..51....9.7')).toEqual('851432796624917583937856421192784635475263819368591274789145362246379158513628947');
    expect(mysolve('.2...5....15...........87.3.51........97...1....3...46....8...17..93..6.......4.8')).toEqual('327695184815473629946128753651842397439756812278319546563284971784931265192567438');
    expect(mysolve('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...')).toEqual('381745629472396158659218473196583742734962581825174936948637215267851394513429867');
    expect(mysolve('.....5.8617.....5......71.9..18....2..8.3.9..7....68..5.92......4.....3761.4.....')).toEqual('923145786176982354485367129351894672268731945794526813539278461842619537617453298');
    expect(mysolve('...71.5..7.2..........9.18..4...6.9.9......5.3.7..4....6......2...87....5.8.....3')).toEqual('894713526712658439635492187241536798986127354357984261169345872423879615578261943');
    expect(mysolve('..6..85......7.613........9....9...1..1...8..4..53....1.7.53....5..64...3..1...6.')).toEqual('296318574584972613713645289625897341931426857478531926167253498859764132342189765');
});
test('sudoku hard ones', () => {
    expect(mysolve('.......12........3..23..4....18....5.6..7.8.......9.....85.....9...4.5..47...6...')).toEqual('839465712146782953752391486391824675564173829287659341628537194913248567475916238');
    expect(mysolve('.2..5.7..4..1....68....3...2....8..3.4..2.5.....6...1...2.9.....9......57.4...9..')).toEqual('123456789457189236869273154271548693346921578985637412512394867698712345734865921');
    expect(mysolve('........3..1..56...9..4..7......9.5.7.......8.5.4.2....8..2..9...35..1..6........')).toEqual('562987413471235689398146275236819754714653928859472361187324596923568147645791832');
    expect(mysolve('12.3....435....1....4........54..2..6...7.........8.9...31..5.......9.7.....6...8')).toEqual('126395784359847162874621953985416237631972845247538691763184529418259376592763418');
    expect(mysolve('1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1')).toEqual('174385962293467158586192734451923876928674315367851249719548623635219487842736591');
    expect(mysolve('.......39.....1..5..3.5.8....8.9...6.7...2...1..4.......9.8..5..2....6..4..7.....')).toEqual('751846239892371465643259871238197546974562318165438927319684752527913684486725193');
    expect(mysolve('12.3.....4.....3....3.5......42..5......8...9.6...5.7...15..2......9..6......7..8')).toEqual('125374896479618325683952714714269583532781649968435172891546237257893461346127958');
    expect(mysolve('..3..6.8....1..2......7...4..9..8.6..3..4...1.7.2.....3....5.....5...6..98.....5.')).toEqual('123456789457189236896372514249518367538647921671293845364925178715834692982761453');
    expect(mysolve('1.......9..67...2..8....4......75.3...5..2....6.3......9....8..6...4...1..25...6.')).toEqual('123456789456789123789123456214975638375862914968314275591637842637248591842591367');
    expect(mysolve('..9...4...7.3...2.8...6...71..8....6....1..7.....56...3....5..1.4.....9...2...7..')).toEqual('239187465675394128814562937123879546456213879798456312367945281541728693982631754');
    expect(mysolve('....9..5..1.....3...23..7....45...7.8.....2.......64...9..1.....8..6......54....7')).toEqual('743892156518647932962351748624589371879134265351276489496715823287963514135428697');
    expect(mysolve('4...3.......6..8..........1....5..9..8....6...7.2........1.27..5.3....4.9........')).toEqual('468931527751624839392578461134756298289413675675289314846192753513867942927345186');
    expect(mysolve('7.8...3.....2.1...5.........4.....263...8.......1...9..9.6....4....7.5...........')).toEqual('728946315934251678516738249147593826369482157852167493293615784481379562675824931');
    expect(mysolve('3.7.4...........918........4.....7.....16.......25..........38..9....5...2.6.....')).toEqual('317849265245736891869512473456398712732164958981257634174925386693481527528673149');
    expect(mysolve('........8..3...4...9..2..6.....79.......612...6.5.2.7...8...5...1.....2.4.5.....3')).toEqual('621943758783615492594728361142879635357461289869532174238197546916354827475286913');
    expect(mysolve('.......1.4.........2...........5.4.7..8...3....1.9....3..4..2...5.1........8.6...')).toEqual('693784512487512936125963874932651487568247391741398625319475268856129743274836159');
    expect(mysolve('.......12....35......6...7.7.....3.....4..8..1...........12.....8.....4..5....6..')).toEqual('673894512912735486845612973798261354526473891134589267469128735287356149351947628');
    expect(mysolve('1.......2.9.4...5...6...7...5.3.4.......6........58.4...2...6...3...9.8.7.......1')).toEqual('174835962293476158586192734957324816428961375361758249812547693635219487749683521');
    expect(mysolve('.....1.2.3...4.5.....6....7..2.....1.8..9..3.4.....8..5....2....9..3.4....67.....')).toEqual('869571324327849516145623987952368741681497235473215869514982673798136452236754198');
    expect(mysolve('6.3.4.5..54...2....18..3..48...29.......8.......41...77..1..89....2...41..1.9.6.5')).toEqual('693841572547962318218573964874329156152687439369415287726154893985236741431798625');
    expect(mysolve('..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9')).toEqual('987654321246173985351928746128537694634892157795461832519286473472319568863745219');
});
