import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import SwitchButton from '../../../features/SwitchButton';
import allegro from '../../../../assets/img/testimages/allegro-favicon.png';
import ActionChart from './ActionChart';
import QuestionModal from '../../../features/modals/QuestionModal';
import InfoModal from '../../../features/modals/InfoModal';

import { AppContext } from '../../../../AppContext';

const actionDetails = {
  id: 0,
  actionName: 'Allegro',
  price: 39.16,
  image: '',
  isFavourite: true,
  isBought: true,
  lastUpdate: '09.12.2021 17:00',
  numberOfActions: 20,
};

let interval = 0;

const MarketplacePage = () => {
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [inputActionsAmount, setInputActionsAmount] = useState(0);
  const [purchaseAction, setPurchaseAction] = useState(true);
  const [chartRange, setChartRange] = useState('today');
  const [displayConfirmModal, setDisplayConfirmModal] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [smartAssistant, setSmartAssistant] = useState(true);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [todayValues, setTodayValues] = useState('');
  const [pastValues, setPastValues] = useState('');
  const { userAccountBalance } = useContext(AppContext);
  const { userSettings } = useContext(AppContext);

  const { actionId } = useParams();

  const fetchActionValues = async () => {
    const API = `http://localhost/api/v1/action/${actionId}`;

    const actionValues = await fetch(API)
      .then((request) => request.json())
      .catch((err) => console.log(err));

    if (actionValues) setIsDataLoaded(true);
    setTodayValues([...actionValues.todayValues]);
    setPastValues([...actionValues.pastValues]);
  };

  const changeChartView = (range) => setChartRange(range);

  //wysłanie info do bazy o dokonanej transakcji
  const confirmTransaction = () => {
    if (purchaseAction) {
      let tempAccountBalance = accountBalance;
      tempAccountBalance -= actionDetails.price * inputActionsAmount;
      actionDetails.numberOfActions += inputActionsAmount;

      setAccountBalance(tempAccountBalance);
    } else {
      let tempAccountBalance = accountBalance;
      tempAccountBalance += actionDetails.price * inputActionsAmount;
      actionDetails.numberOfActions -= inputActionsAmount;
      setAccountBalance(tempAccountBalance);
    }
    setInputActionsAmount(0);
    setDisplayConfirmModal(!displayConfirmModal);
  };

  const handleChangePurchaseAction = () => setPurchaseAction(!purchaseAction);

  const handleConfirmTransaction = (e) => {
    e.preventDefault();
    if (inputActionsAmount <= 0) displayInfoModal('Określ liczbę akcji!');
    else if (
      inputActionsAmount * actionDetails.price > accountBalance &&
      purchaseAction &&
      purchaseAction
    )
      displayInfoModal('Nie masz wystarczających środków na koncie!');
    else if (
      inputActionsAmount > actionDetails.numberOfActions &&
      !purchaseAction
    )
      displayInfoModal('Nie posiadasz tylu akcji na sprzedaż!');
    else setDisplayConfirmModal(!displayConfirmModal);
  };

  const handleInputActionsValueChange = (e, type, mouseEvent = 'click') => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars

    if (mouseEvent === 'click') {
      if (type === 'add') setInputActionsAmount(inputActionsAmount + 1);
      if (type === 'subtract' && inputActionsAmount > 0)
        setInputActionsAmount(inputActionsAmount - 1);
    }

    if (mouseEvent === 'hold') {
      if (type === 'add')
        interval = setInterval(
          () => setInputActionsAmount((prevAmount) => prevAmount + 1),
          100
        );

      if (type === 'subtract') {
        let actualNumber = inputActionsAmount;

        interval = setInterval(() => {
          if (actualNumber > 0) {
            setInputActionsAmount((prevAmount) => prevAmount - 1);
            actualNumber--;
          }
        }, 100);
      }
    }

    if (mouseEvent === 'release') {
      clearInterval(interval);
    }
  };

  // const URLParams = () => {
  //   let params = useParams();
  //   console.log(params.actionId);
  //   return null;
  // };

  const modalTextSetter = () => {
    let inflection = 'akcji';
    let transactionType = 'kupić';
    let text = '';
    if (inputActionsAmount > 1 && inputActionsAmount < 5) inflection = 'akcje';
    else if (inputActionsAmount === 1) inflection = 'akcję';

    if (!purchaseAction) transactionType = 'sprzedać';

    text = `Czy na pewno chcesz ${transactionType} ${inputActionsAmount} ${inflection} ${actionDetails.actionName}?`;
    return text;
  };

  const { price, numberOfActions } = actionDetails;

  const displayInfoModal = (message) => {
    setInfoMessage(message);
    setInfoVisible(true);
    setTimeout(() => {
      setInfoVisible(false);
    }, 3000);
  };

  useEffect(() => {
    setAccountBalance(Number(userAccountBalance));
    setSmartAssistant(userSettings.smartAssistant);
    fetchActionValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className='marketplace-page'>
      {/* {getBollingerBands()} */}
      {/* {fillDataArrays()} */}

      {displayConfirmModal ? (
        <QuestionModal
          acceptAction={confirmTransaction}
          denyAction={() => setDisplayConfirmModal(!displayConfirmModal)}
          info={modalTextSetter()}
        />
      ) : null}
      <section className='marketplace-page__details'>
        <div className='marketplace-page__choosen-action'>
          <img src={allegro} alt='' />
          <h1>{actionDetails.actionName}</h1>
          <NavLink to={`/app/search`} className='navlink--casual'>
            <i className='fa fa-search' aria-hidden='true'></i>
          </NavLink>
        </div>
        <section className='marketplace-page__info'>
          <p className='marketplace-page__account-balance'>
            Stan konta: {accountBalance ? accountBalance.toFixed(2) : null} zł
          </p>
          <p className='marketplace-page__action-price'>
            Aktualna cena akcji: {price.toFixed(2)} zł
          </p>
          <p className='marketplace-page__number-of-actions'>
            Ilość posiadanych akcji: {numberOfActions} szt.
          </p>
          <p className='marketplace-page__total-actions-amount'>
            Wartość posiadanych akcji: {(numberOfActions * price).toFixed(2)} zł
          </p>
        </section>

        <section className='marketplace-page__trade'>
          <form onSubmit={handleConfirmTransaction}>
            <input
              className='marketplace-page__input input'
              type='text'
              readOnly
              value={inputActionsAmount}
            />

            <button
              className='button button--math'
              onMouseDown={(e) =>
                handleInputActionsValueChange(e, 'subtract', 'hold')
              }
              onMouseUp={(e) =>
                handleInputActionsValueChange(e, 'subtract', 'release')
              }
              onClick={(e) => handleInputActionsValueChange(e, 'subtract')}
            >
              <i className='fa fa-minus' aria-hidden='true'></i>
            </button>

            <button
              className='button button--math'
              onMouseDown={(e) =>
                handleInputActionsValueChange(e, 'add', 'hold')
              }
              onMouseUp={(e) =>
                handleInputActionsValueChange(e, 'add', 'release')
              }
              onClick={(e) => handleInputActionsValueChange(e, 'add')}
            >
              <i className='fa fa-plus' aria-hidden='true'></i>
            </button>

            <p>
              Wartość wybranych akcji: {(inputActionsAmount * price).toFixed(2)}{' '}
              zł
            </p>

            <div className='marketplace-page__transaction-type'>
              <p>Typ transakcji: </p>

              <SwitchButton
                firstOption='Kup'
                secondOption='Sprzedaj'
                checkedState={purchaseAction}
                toggleOptionHandler={handleChangePurchaseAction}
              />
            </div>

            <button className='button' type='submit'>
              Finalizuj
            </button>
          </form>
        </section>
      </section>
      <section className='marketplace-page__action-chart'>
        {isDataLoaded && pastValues !== '' && todayValues !== '' ? (
          <>
            <ActionChart
              actionName={actionDetails.actionName}
              todayActionValues={todayValues}
              pastActionValues={pastValues}
              chartRange={chartRange}
            />

            <div className='marketplace-page__chart-buttons'>
              <button
                className='button marketplace-page__chart-button'
                onClick={() => changeChartView('today')}
              >
                Dzisiaj
              </button>
              <button
                className='button marketplace-page__chart-button'
                onClick={() => changeChartView('week')}
              >
                Ostatnie 7 dni
              </button>
              <button
                className='button marketplace-page__chart-button'
                onClick={() => changeChartView('month')}
              >
                Ostatni miesiąc
              </button>
              <button
                className='button marketplace-page__chart-button'
                onClick={() => changeChartView('quarter')}
              >
                Ostatnie 3 miesiące
              </button>
            </div>
          </>
        ) : null}
      </section>
      <InfoModal message={infoMessage} visible={infoVisible} position='right' />
      {/* {console.log(infoMessage)} */}
    </main>
  );
};

export default MarketplacePage;
