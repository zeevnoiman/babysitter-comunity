import React, {useState, useContext, useEffect, Fragment } from 'react';
import { View, Text,
        TouchableOpacity, Image, 
        ScrollView, Linking,
        Modal, TextInput, Alert
       } from 'react-native';
import {MaterialIcons, FontAwesome, Ionicons, Feather, EvilIcons} from '@expo/vector-icons'
import api from '../../services/api';
import StarRating from 'react-native-star-rating';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Formik, useField, useFormikContext} from 'formik'
import {isDate, getHours, getMinutes, setHours, setMinutes} from 'date-fns'
import { he } from 'date-fns/locale'
import { zonedTimeToUtc, format } from 'date-fns-tz';
import * as MailComposer from 'expo-mail-composer';
import * as Yup from 'yup';

import styles from './styles';
import anonimusImage from '../../assets/anonimo.png';
import { userContext } from '../../contexts/UserContext';

const DatePickerField = ({ ...props }) => {
    
    const { setFieldValue } = useFormikContext();
    const [field] = useField(props);
    const initialDate = field.value
    console.log(field.value);
    console.log(field.name);
    
    function handleChange(name, val){
        console.log('handle change function');
        var hoursSetted;
        var minutesSetted;
        if(props.mode == 'time'){
            console.log(initialDate);
            console.log(field.value);
            hoursSetted = setHours(initialDate, getHours(new Date(val.nativeEvent.timestamp)))
            minutesSetted = setMinutes(hoursSetted, getMinutes(new Date(val.nativeEvent.timestamp)))
            console.log(name, minutesSetted);
        }
        props.state(false);
        
        if(val.nativeEvent.timestamp){
            if(props.mode == 'time'){
                setFieldValue(name, new Date(minutesSetted));

            }else{
            setFieldValue(name, new Date(val.nativeEvent.timestamp));
            }
            if(props.nextState){
                props.nextState(true)
            }
        }
    }
    return (
        <DateTimePicker
            {...props}
            mode = {props.mode}
            value={field.value || null}
            onChange={val => handleChange(field.name, val) }
        />
    );
};

function SavedNannyProfileToFamilyView({worker, navigation}){

    const {user, addLikedBabysitter, deleteLikedBabysitter, addWork} = useContext(userContext);

    const [isLiked, setIsLiked] = useState(false);
    const [starCount, setStarCount] = useState(3.5);
    const [modalVisible, setModalVisible] = useState(false);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartHour, setShowStartHour] = useState(false);
    const [showFinishDate, setShowFinishDate] = useState(false);
    const [showFinishHour, setShowFinishHour] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState('');

    useEffect(() => {
        console.log(user);
        
        user.likedBabysitters.map(babysitter => {
            if(babysitter === worker._id){
                setIsLiked(true)
            }
        })
    }, [user])
   
    useEffect(() => {
        if(modalVisible == false){
            if(scheduleMessage != ''){
                Alert.alert(scheduleMessage)
            }
        }
    }, [modalVisible])
    function sendMail(){
        const message = "Hi, I sow you on Super Nanny, I would like to talk to you about a service, are you interested? thank you!" 
        MailComposer.composeAsync({
            subject: 'Super Nanny, somebody need you!',
            recipients: [worker.email],
            body: message,
        })
    }

    function sendWhatsapp(){
        const message = "Hi, I sow you on Super Nanny, I would like to call you for a service, are you interested? thank you!"
        Linking.openURL(`whatsapp://send?phone=${worker.phone}&text=${message}`)
    }
    
    function makePhoneCall(){
        Linking.openURL(`tel:+${worker.phone}`);
    }

    function handleSetIsLiked(isLiked){
        setIsLiked(isLiked);
        if(isLiked){
            addLikedBabysitter(worker);
        }else{
            deleteLikedBabysitter(worker);
        }
    }
     function handleSetModalVisible(flag){
         setModalVisible(flag);
         setShowFinishDate(false);
         setShowFinishHour(false);
         setShowStartDate(false);
         setShowStartHour(false);
     }

    // const onChange = (event, selectedDate) => {
    //     const currentDate = selectedDate || date;
    //     setShow(Platform.OS === 'ios');
    //     setDate(currentDate);
    //   };

    async function submitModalForm(values){
        console.log(values);
        const date_hour_start_string = `${format(values.dateStart, 'yyyy-MM-dd HH:mm:ss')}`
        const date_hour_finish_string = `${format(values.dateFinish, 'yyyy-MM-dd HH:mm:ss')}`
        
        console.log(date_hour_start_string);
        
        const work = {
            serviceDescription : values.descriptionInput,
            date_hour_start_string,
            date_hour_finish_string,
            defined_value_to_pay : values.rate
        }
        const response = await addWork(work, worker._id)
        console.log(response);
        setScheduleMessage(response);
        handleSetModalVisible(false);

    }
    

    const ScheduleSchema = Yup.object().shape({
        descriptionInput: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
      rate: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
      dateStart: Yup.date(),
      dateFinish: Yup.date()
        .min(Yup.ref('dateStart'), 'End date must be later than start date')
        .required('required'),
    });

    return(
    <ScrollView 
    contentContainerStyle = {styles.contentContainer} 
    >
        <View style={styles.imageBox}>  
       { worker.photo.length > 0 ?
            <Image style={styles.anonimusImage} source={{uri : `http://10.0.0.18:3333/static/${worker.photo}`}}/>
            :
            <Image style={styles.anonimusImage} source={anonimusImage}/>
            }
            <StarRating
                disabled={false}
                containerStyle={styles.starsContainer}
                starSize={25}
                maxStars={5}
                rating={worker.stars}
                fullStarColor={'#fff000'}
                selectedStar={() => navigation.navigate('NannyReviews',{'nanny': worker})}
            />
            <TouchableOpacity style={styles.likeButton} onPress={() => handleSetIsLiked(!isLiked)}>
                {isLiked ?
                <Ionicons name='md-heart' size={35} style={{color: '#f20079'}}></Ionicons>
                :
                <Ionicons name='md-heart-empty' size={35} style={{color: '#515151'}}></Ionicons>}
            </TouchableOpacity>
        </View>
        <View style={styles.rateBox}>
            <FontAwesome name='shekel' size={15} style={styles.shekel} ></FontAwesome>
                <Text style={styles.ratePrice}>{worker.rate}/h</Text>    
        </View>
        <Text style={styles.name}>{worker.name}</Text>
        <View style={styles.ageBox}>
            <Text style={styles.yearsOld}> {worker.age} Years Old</Text>
        </View>
        
        <View style={styles.addressBox}>
            <FontAwesome name='home' size={30} style={{color: '#759d81'}}></FontAwesome>
            <Text style={styles.text}>{worker.street}, {worker.neighborhood}, {worker.city}</Text>
        </View>
        <View style={styles.profissonalBox}>
            <MaterialIcons name='work' size={30} style={{color: '#759d81'}}></MaterialIcons>
            <Text style={styles.text}>
                {worker.bio}
            </Text>
        </View>
        <View style={styles.languagesBox}>
        <FontAwesome name='language' size={30} style={{color: '#759d81'}}></FontAwesome>
        {worker.languagesArray.map((language, index) => (
            <Text style={styles.text} key={index}>{language}</Text>
        ))}
        </View>    
        <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={sendWhatsapp}>
            <Ionicons name='logo-whatsapp' size={25} style={[{color: '#fff'}]}/>   
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={sendMail}>
            <MaterialIcons name='email' size={25} style={[{color:'#fff'}]}/>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, {marginRight: 0}]} onPress={makePhoneCall}>
            <Feather name='phone-call' size={20}  style={[{color: '#fff'}]}/> 
            </TouchableOpacity>
        </View>
        <View style={styles.scheduleContainer}>
            <TouchableOpacity style={styles.schedule} onPress={() => handleSetModalVisible(true)}>
               <Text style={styles.textSchedule}>Schedule</Text>   
            </TouchableOpacity>    
        </View>

        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.titleModal}>Service Details</Text>
            <Formik 
            style={styles.modalForm}
            initialValues={{descriptionInput : '', rate : '', dateStart : new Date(), dateFinish : new Date()}}
            validationSchema={ScheduleSchema}
            onSubmit = {values => submitModalForm(values)}
            >
                {({ values, handleChange, errors, setFieldTouched, touched, isValid, handleSubmit }) => (
                    <Fragment>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder='What kind of service, how many childrens, their ages, slepping or awake children, any personal notes about the visit...'
                        placeholderTextColor='#333'
                        multiline={true}
                        numberOfLines={3}
                        maxLength={200}
                        value={values.descriptionInput}
                        onChangeText={handleChange('descriptionInput')}
                        ref={(input) => { globalThis.Experiences = input; }}>
                    </TextInput>
                    {errors.descriptionInput && touched.descriptionInput ? (
                        <Text style={styles.validationMessage}>{errors.descriptionInput}</Text>
                    ) : null}
                    
                    <View style={styles.dateTimeInput}>
                        <Text style={styles.dateText}>Select start date:</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDate(true)}>
                            {isDate(values.dateStart) && <Text style={styles.dateTextButton}>{format(values.dateStart, 'dd/MM/yyyy HH:mm:ss' )}</Text>} 
                        </TouchableOpacity>
                        {errors.dateStart && touched.dateStart ? (
                            <Text>{errors.dateStart}</Text>
                        ) : null}
                        <Text style={styles.dateText}>Select finish date:</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowFinishDate(true)}>
                        {isDate(values.dateFinish) && <Text style={styles.dateTextButton}>{format(values.dateFinish, 'dd/MM/yyyy HH:mm:ss')}</Text>}
                        </TouchableOpacity>
                        {errors.dateFinish && touched.dateFinish ? (
                            <Text>{errors.dateFinish}</Text>
                        ) : null}
                        {showStartDate && (
                            <DatePickerField
                              value={values.dateStart}
                              name="dateStart"
                              timeZoneOffsetInMinutes={0}
                              mode='date'
                              is24Hour={true}
                              display="default"
                              state = {setShowStartDate}
                              nextState = {setShowStartHour}
                            />
                          )}
                          {showStartHour && (
                            <DatePickerField
                            value={values.hourStart}
                              name="dateStart"
                              timeZoneOffsetInMinutes={0}
                              mode='time'
                              is24Hour={true}
                              display="default"
                              state = {setShowStartHour}
                              nextState= { null }
                            />
                          )}
                          {showFinishDate && (
                            <DatePickerField
                            value={values.dateFinish}
                              name="dateFinish"
                              timeZoneOffsetInMinutes={0}
                              mode='date'
                              is24Hour={true}
                              display="default"
                              state = {setShowFinishDate}
                              nextState={setShowFinishHour} 
                            />
                          )}
                          {showFinishHour && (
                            <DatePickerField
                            value={values.hourFinish}
                              name="dateFinish"
                              timeZoneOffsetInMinutes={0}
                              mode='time'
                              is24Hour={true}
                              display="default"
                              state = {setShowFinishHour}
                              nextState={null}
                            />
                          )}
                    </View>
                    <View style={styles.verticalBox}>
                        <Text style={styles.rateText}>Value fixed to pay in shekels</Text>   
                        <TextInput
                        placeholder='Rate'
                        placeholderTextColor='#333'
                        value={values.rate}
                        onChangeText={handleChange('rate')}
                        style={styles.rateInput}
                        >
                        </TextInput>    
                        <FontAwesome name='shekel' size={16} style={{marginTop: 20, marginLeft: 10}}></FontAwesome>
                    </View>
                    {errors.rate && touched.rate ? (
                        <Text>{errors.rate}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={
                        handleSubmit}
                    >
                      <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => {
                        setModalVisible(!modalVisible);
                      }}
                    >
                      <EvilIcons name='close' size={20} style={styles.textStyle}></EvilIcons>
                    </TouchableOpacity>
                </Fragment>
                    )}
            </Formik>

            
          </View>
        </View>
      </Modal>
    </ScrollView>
    )
}

function SavedNannyProfileToNannyView({worker}){
    
    const [starCount, setStarCount] = useState(3.5);
    
    console.log(worker);
    
    return(
    <ScrollView 
    contentContainerStyle = {styles.contentContainer} 
    >
        <View style={styles.imageBox}>  
       { worker.photo.length > 0 ?
            <Image style={styles.anonimusImage} source={{uri :`http://10.0.0.18:3333/static/${worker.photo}` }}/>
            :
            <Image style={styles.anonimusImage} source={anonimusImage}/>
            }
            <StarRating
                disabled={false}
                containerStyle={styles.starsContainer}
                starSize={25}
                maxStars={5}
                rating={starCount}
                fullStarColor={'#fff000'}
                selectedStar={(rating) => setStarCount(rating)}
            />
        </View>
        <View style={styles.rateBox}>
            <FontAwesome name='shekel' size={15} style={styles.shekel} ></FontAwesome>
                <Text style={styles.ratePrice}>{worker.rate}/h</Text>    
            </View>
        <Text style={styles.name}>{worker.name}</Text>
        <View style={styles.ageBox}>
            <Text style={styles.yearsOld}> {worker.age} Years Old</Text>
        </View>
        
        <View style={styles.addressBox}>
            <FontAwesome name='home' size={30} style={{color: '#759d81'}}></FontAwesome>
            <Text style={styles.text}>{worker.street}, {worker.neighborhood}, {worker.city}</Text>
        </View>
        <View style={styles.profissonalBox}>
            <MaterialIcons name='work' size={30} style={{color: '#759d81'}}></MaterialIcons>
            <Text style={styles.text}>
                {worker.bio}
            </Text>
        </View>
        <View style={styles.languagesBox}>
        <FontAwesome name='language' size={30} style={{color: '#759d81'}}></FontAwesome>
        {worker.languagesArray.map((language, index) => (
            <Text style={styles.text} key={index}>{language}</Text>
        ))}
        </View>    
    </ScrollView>
    )
}




export default function SavedNannyProfile({navigation}){
    
    const {token, user} = useContext(userContext);
    const worker = navigation.getParam('worker'); 
    
    return(
        user.role == 'Family' ?
        <SavedNannyProfileToFamilyView worker={worker} navigation={navigation} />
        :
        <SavedNannyProfileToNannyView worker={worker}/>
        
    )
}